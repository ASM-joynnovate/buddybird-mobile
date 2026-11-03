import { Platform } from 'react-native';

import type { PetcamEventKind, SessionLogItem, SessionPetcamVideoParams } from '@/types/apis/sessions';
import type { PetcamEventUpload, PostSessionPetcamEventUploadParams, PutUploadFileParams } from '@/types/apis/uploads';

import dayjs from 'dayjs';
import { randomUUID } from 'expo-crypto';
import { File } from 'expo-file-system';
import type { MediaStream } from 'react-native-webrtc';

import { FRAME_CAPTURE_PROCESSOR, FrameCapture, type ParrotCheckResult } from '@modules/frame-capture/src';

import { SECOND } from '@/config/units';
import {
	recordParrotCheck,
	recordParrotMotionIou,
	recordPetcamUpload,
	recordPetcamUploadFailure,
} from '@/screens/session/services/petcam-telemetry';
import { deleteFile } from '@/services/media/file';
import {
	getParrotCheck,
	getParrotMotion,
	getParrotNightCorrection,
	getParrotVideo,
	getPetcamVideo,
	shouldCheckParrotMotion,
} from '@/services/remote-config/client';

type ClipUriPromise = Promise<string | null>;
type BirdBox = NonNullable<ParrotCheckResult['birdBox']>;

interface IssuedUpload {
	upload: PetcamEventUpload;
	expiresAt: number;
}

interface PendingEvent {
	kind: PetcamEventKind;
	photoUri: string;
	occurredAt: string;
	clip: ClipUriPromise | null;
	idempotencyKey: string;
	issuedUpload: IssuedUpload | null;
}

interface PendingVideo {
	eventId: string;
	clip: ClipUriPromise;
}

interface ParrotWatcherOptions {
	sessionId: string;
	stream: MediaStream;
	loadPetcamLog: () => Promise<SessionLogItem[]>;
	isSleeping: () => boolean;
	issuePetcamEventUpload: (variables: PostSessionPetcamEventUploadParams) => Promise<PetcamEventUpload>;
	uploadPetcamPhoto: (variables: PutUploadFileParams) => Promise<void>;
	uploadPetcamVideo: (variables: Omit<SessionPetcamVideoParams, 'idempotencyKey'>) => Promise<void>;
	onError: (error: unknown) => void;
}

/** 두 box의 IoU를 반환하는 함수 */
const boxIou = (box: BirdBox, otherBox: BirdBox) => {
	const overlapWidth = Math.max(
		0,
		Math.min(box.x + box.width, otherBox.x + otherBox.width) - Math.max(box.x, otherBox.x),
	);
	const overlapHeight = Math.max(
		0,
		Math.min(box.y + box.height, otherBox.y + otherBox.height) - Math.max(box.y, otherBox.y),
	);
	const overlapArea = overlapWidth * overlapHeight;
	const unionArea = box.width * box.height + otherBox.width * otherBox.height - overlapArea;

	return unionArea > 0 ? overlapArea / unionArea : 0;
};

/** 앵무새 검출을 시작하는 함수 */
export const createParrotWatcher = (options: ParrotWatcherOptions) => {
	const checkSettings = getParrotCheck();
	const clipSettings = getParrotVideo();
	const nightSettings = getParrotNightCorrection();
	const motionSettings = getParrotMotion();
	const videoSettings = getPetcamVideo();
	const motionCheckEnabled = shouldCheckParrotMotion();

	const [videoTrack] = options.stream.getVideoTracks();

	let watcherClosed = false;
	let parrotChecking = false;
	let videoSending = false;
	let lowLightEnabled = false;
	let parrotUndetected: boolean | null = null;
	let parrotMotionless = false;
	let sessionSleeping = false;
	let undetectedStreak = 0;
	let motionlessStreak = 0;
	let firstUndetectedAt: string | null = null;
	let firstMotionlessAt: string | null = null;
	let referenceBox: BirdBox | null = null;
	let clip: ClipUriPromise | null = null;
	let latestClip: ClipUriPromise | null = null;
	let pendingEvent: PendingEvent | null = null;
	let pendingVideo: PendingVideo | null = null;

	/** 실패를 보고하며 파일을 삭제하는 함수 */
	const deleteFileSafely = (uri: string) => {
		try {
			deleteFile(uri);
		} catch (e) {
			options.onError(e);
		}
	};

	/** 마지막 펫캠 이벤트로 검출 상태를 반환하는 함수 */
	const loadPetcamState = async () => {
		const petcamLog = await options.loadPetcamLog();
		const uploadedKinds = petcamLog
			.filter((logItem) => 'image' in logItem && logItem.image?.status === 'uploaded')
			.map((logItem) => logItem.kind);

		return {
			parrotUndetected:
				uploadedKinds.filter((kind) => kind === 'parrot_disappeared' || kind === 'parrot_appeared').at(-1) ===
				'parrot_disappeared',
			parrotMotionless: uploadedKinds.filter((kind) => kind !== 'parrot_appeared').at(-1) === 'parrot_motionless',
		};
	};

	/** 현재 시점의 앞뒤 영상 저장을 시작하는 함수 */
	const startClip = () => {
		const startedClip: ClipUriPromise = FrameCapture.saveVideoClip(clipSettings.afterMs).catch((error: unknown) => {
			options.onError(error);

			return null;
		});

		latestClip = startedClip;

		return startedClip;
	};

	/** 임시 영상을 삭제하는 함수 */
	const deleteClip = (deletedClip: ClipUriPromise) => {
		// 저장 중인 영상은 마지막 영상뿐
		if (deletedClip === latestClip) {
			FrameCapture.discardVideoClip();
		}

		void deletedClip.then((uri) => {
			if (uri) {
				deleteFileSafely(uri);
			}
		});
	};

	/** 사진 밝기에 맞춰 카메라 노출 변경 함수 */
	const syncLowLight = async (brightness: number) => {
		const photoDark = nightSettings.correctionEnabled && brightness < nightSettings.startBrightness;

		if (!videoTrack || photoDark === lowLightEnabled) {
			return;
		}

		if (Platform.OS === 'ios') {
			FrameCapture.setLowLight(photoDark, nightSettings.frameRate);
		} else {
			// Android는 프레임 수를 낮추면 노출이 길어짐
			await videoTrack.applyConstraints({
				...videoSettings,
				frameRate: photoDark ? nightSettings.frameRate : videoSettings.frameRate,
			});
		}

		lowLightEnabled = photoDark;
	};

	/** 업로드 전 이벤트를 취소하는 함수 */
	const cancelPendingEvent = (kind: PetcamEventKind) => {
		if (pendingEvent?.kind !== kind) {
			return;
		}

		deleteFileSafely(pendingEvent.photoUri);

		if (pendingEvent.clip) {
			deleteClip(pendingEvent.clip);
		}

		pendingEvent = null;
	};

	/** 앵무새 검출을 반영하는 함수 */
	const recordParrotDetected = (photoUri: string, occurredAt: string) => {
		undetectedStreak = 0;
		firstUndetectedAt = null;

		if (clip) {
			deleteClip(clip);

			clip = null;
		}

		// 미검출 사진 업로드 전에 검출되면 취소
		cancelPendingEvent('parrot_disappeared');

		if (!parrotUndetected || pendingEvent) {
			return false;
		}

		pendingEvent = {
			kind: 'parrot_appeared',
			photoUri,
			occurredAt,
			clip: null,
			idempotencyKey: randomUUID(),
			issuedUpload: null,
		};

		return true;
	};

	/** 앵무새 미검출을 반영하는 함수 */
	const recordParrotUndetected = (photoUri: string, occurredAt: string) => {
		// 앵무새 미검출을 보낸 뒤에는 카운트하지 않음
		if (parrotUndetected && !pendingEvent) {
			return false;
		}

		undetectedStreak += 1;

		if (undetectedStreak === 1) {
			firstUndetectedAt = occurredAt;
			clip = startClip();
		}

		if (
			undetectedStreak < checkSettings.undetectedCount ||
			parrotUndetected ||
			pendingEvent ||
			!firstUndetectedAt
		) {
			return false;
		}

		pendingEvent = {
			kind: 'parrot_disappeared',
			photoUri,
			occurredAt: firstUndetectedAt,
			clip,
			idempotencyKey: randomUUID(),
			issuedUpload: null,
		};
		clip = null;

		return true;
	};

	/** 움직임 판정을 초기화하는 함수 */
	const resetMotionJudgment = () => {
		motionlessStreak = 0;

		// 움직임 없음 상태면 기준 box 유지
		if (!parrotMotionless) {
			referenceBox = null;
		}

		cancelPendingEvent('parrot_motionless');
	};

	/** 검출 box를 움직임 판정에 반영하는 함수 */
	const recordParrotBox = (birdBox: BirdBox, photoUri: string, occurredAt: string) => {
		const iou = referenceBox ? boxIou(referenceBox, birdBox) : null;
		const parrotMoved = iou !== null && iou < motionSettings.iouThreshold;

		if (iou !== null) {
			recordParrotMotionIou(iou);
		}

		if (parrotMoved && parrotMotionless) {
			if (pendingEvent) {
				return false;
			}

			pendingEvent = {
				kind: 'parrot_moved',
				photoUri,
				occurredAt,
				clip: null,
				idempotencyKey: randomUUID(),
				issuedUpload: null,
			};
			referenceBox = null;
			motionlessStreak = 0;

			return true;
		}

		if (iou === null || parrotMoved) {
			cancelPendingEvent('parrot_motionless');

			referenceBox = birdBox;
			firstMotionlessAt = occurredAt;
			motionlessStreak = 1;
		} else if (!parrotMotionless) {
			motionlessStreak += 1;
		}

		if (
			parrotMotionless ||
			pendingEvent ||
			motionlessStreak < motionSettings.motionlessCount ||
			!firstMotionlessAt
		) {
			return false;
		}

		pendingEvent = {
			kind: 'parrot_motionless',
			photoUri,
			occurredAt: firstMotionlessAt,
			clip: startClip(),
			idempotencyKey: randomUUID(),
			issuedUpload: null,
		};
		motionlessStreak = 0;

		return true;
	};

	/** 확인 결과를 반영하는 함수 */
	const recordCheckResult = (checkResult: ParrotCheckResult) => {
		const occurredAt = dayjs(checkResult.capturedAt).toISOString();
		const shouldCheckMotion = motionCheckEnabled && !sessionSleeping;

		// 너무 어두운 사진은 카운트하지 않음
		if (checkResult.brightness < checkSettings.minBrightness) {
			deleteFileSafely(checkResult.uri);

			return;
		}

		let photoKept: boolean;

		if (checkResult.birdScore >= checkSettings.scoreThreshold) {
			const appearedPhotoKept = recordParrotDetected(checkResult.uri, occurredAt);
			const motionPhotoKept =
				shouldCheckMotion &&
				checkResult.birdBox !== null &&
				recordParrotBox(checkResult.birdBox, checkResult.uri, occurredAt);

			photoKept = appearedPhotoKept || motionPhotoKept;
		} else {
			if (shouldCheckMotion) {
				resetMotionJudgment();
			}

			photoKept = recordParrotUndetected(checkResult.uri, occurredAt);
		}

		// 이벤트에 사용하지 않는 사진만 삭제
		if (!photoKept) {
			deleteFileSafely(checkResult.uri);
		}
	};

	/** 이벤트 사진 업로드 URL을 반환하는 함수 */
	const issueEventUpload = async (event: PendingEvent) => {
		const requestedAt = dayjs().valueOf();

		if (event.issuedUpload && requestedAt < event.issuedUpload.expiresAt) {
			return event.issuedUpload.upload;
		}

		// URL이 만료되면 새 이벤트로 다시 발급
		const idempotencyKey = event.issuedUpload ? randomUUID() : event.idempotencyKey;
		const upload = await options.issuePetcamEventUpload({
			id: options.sessionId,
			uri: event.photoUri,
			data: { kind: event.kind, occurred_at: event.occurredAt },
			idempotencyKey,
		});

		if (pendingEvent === event) {
			pendingEvent = {
				...event,
				idempotencyKey,
				issuedUpload: { upload, expiresAt: requestedAt + upload.expires_in * SECOND },
			};
		}

		return upload;
	};

	/** 앵무새 미검출 영상을 업로드하는 함수 */
	const sendVideo = async () => {
		const sendingVideo = pendingVideo;

		if (!sendingVideo || videoSending) {
			return;
		}

		videoSending = true;

		try {
			const uri = await sendingVideo.clip;

			if (pendingVideo !== sendingVideo) {
				return;
			}

			if (!uri) {
				pendingVideo = null;

				return;
			}

			const startedAt = dayjs().valueOf();
			const bytes = new File(uri).size;

			await options.uploadPetcamVideo({ id: options.sessionId, eventId: sendingVideo.eventId, uri });

			recordPetcamUpload('video', bytes, dayjs().valueOf() - startedAt);

			deleteFileSafely(uri);

			if (pendingVideo === sendingVideo) {
				pendingVideo = null;
			}
		} catch (e) {
			// 지난 영상의 실패는 보고하지 않음
			if (!watcherClosed && pendingVideo === sendingVideo) {
				recordPetcamUploadFailure('video');

				options.onError(e);
			}
		} finally {
			videoSending = false;
		}
	};

	/** 이벤트 사진을 업로드하는 함수 */
	const sendEvent = async () => {
		if (!pendingEvent) {
			return;
		}

		const startedAt = dayjs().valueOf();
		const { photoUri } = pendingEvent;

		let bytes: number;
		let upload: PetcamEventUpload;

		try {
			bytes = new File(photoUri).size;
			upload = await issueEventUpload(pendingEvent);

			await options.uploadPetcamPhoto({ upload, uri: photoUri });
		} catch (e) {
			if (!watcherClosed) {
				recordPetcamUploadFailure('photo');

				options.onError(e);
			}

			return;
		}

		const sentEvent = pendingEvent;

		if (watcherClosed || !sentEvent) {
			return;
		}

		recordPetcamUpload('photo', bytes, dayjs().valueOf() - startedAt);

		deleteFileSafely(photoUri);

		pendingEvent = null;

		switch (sentEvent.kind) {
			case 'parrot_disappeared':
				parrotUndetected = true;
				parrotMotionless = false;
				referenceBox = null;
				break;
			case 'parrot_appeared':
				parrotUndetected = false;
				break;
			case 'parrot_motionless':
				parrotMotionless = true;
				break;
			case 'parrot_moved':
				parrotMotionless = false;
				break;
		}

		if (!sentEvent.clip) {
			return;
		}

		if (pendingVideo) {
			deleteClip(pendingVideo.clip);
		}

		pendingVideo = { eventId: upload.event_id, clip: sentEvent.clip };
	};

	/** 주기마다 앵무새를 확인하는 함수 */
	const checkParrot = async () => {
		if (parrotChecking) {
			return;
		}

		parrotChecking = true;

		try {
			if (parrotUndetected === null) {
				const petcamState = await loadPetcamState();

				parrotUndetected = petcamState.parrotUndetected;
				parrotMotionless = petcamState.parrotMotionless;
			}

			if (watcherClosed) {
				return;
			}

			const sessionWasSleeping = sessionSleeping;

			sessionSleeping = motionCheckEnabled && options.isSleeping();

			// 수면 단계 진입 시 움직임 판정 초기화
			if (sessionSleeping && !sessionWasSleeping) {
				resetMotionJudgment();
			}

			const checkResult = await FrameCapture.checkParrot(
				nightSettings.correctionEnabled,
				nightSettings.startBrightness,
				nightSettings.mergeMs,
				checkSettings.photoQuality,
			);

			// 프레임을 수신하지 못한 확인은 카운트하지 않음
			if (checkResult) {
				recordParrotCheck(checkResult);

				await syncLowLight(checkResult.brightness).catch(options.onError);

				if (watcherClosed) {
					deleteFileSafely(checkResult.uri);
				} else {
					recordCheckResult(checkResult);
				}
			}

			if (watcherClosed) {
				return;
			}

			await sendEvent();

			void sendVideo();
		} catch (e) {
			if (!watcherClosed) {
				options.onError(e);
			}
		} finally {
			parrotChecking = false;
		}
	};

	videoTrack?._setVideoEffect(FRAME_CAPTURE_PROCESSOR);

	FrameCapture.startVideoBuffer(
		clipSettings.width,
		clipSettings.height,
		clipSettings.frameRate,
		clipSettings.bitrate,
		clipSettings.beforeMs,
	);

	const timer = setInterval(() => void checkParrot(), checkSettings.intervalMs);

	return {
		/** 앵무새 검출을 멈추는 함수 */
		close: () => {
			watcherClosed = true;

			clearInterval(timer);

			if (lowLightEnabled && Platform.OS === 'ios') {
				FrameCapture.setLowLight(false, nightSettings.frameRate);
			}

			FrameCapture.stopVideoBuffer();

			if (pendingEvent) {
				deleteFileSafely(pendingEvent.photoUri);
			}

			for (const remainingClip of [clip, pendingEvent?.clip, pendingVideo?.clip]) {
				if (remainingClip) {
					deleteClip(remainingClip);
				}
			}

			clip = null;
			pendingEvent = null;
			pendingVideo = null;
		},
	};
};

export type ParrotWatcher = ReturnType<typeof createParrotWatcher>;
