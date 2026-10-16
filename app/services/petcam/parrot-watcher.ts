import { Platform } from 'react-native';

import type { PetcamEventKind, SessionPetcamEvent } from '@/types/apis/sessions';
import type { PetcamEventUpload, Upload } from '@/types/apis/uploads';

import { FRAME_CAPTURE_PROCESSOR, FrameCapture, type ParrotCheckResult } from '@modules/frame-capture/src';
import dayjs from 'dayjs';
import { randomUUID } from 'expo-crypto';
import { File } from 'expo-file-system';
import type { MediaStream } from 'react-native-webrtc';

import { SECOND } from '@/config/units';
import { deleteFile } from '@/services/media/file';
import {
	getParrotCheck,
	getParrotNightCorrection,
	getParrotVideo,
	getPetcamVideo,
} from '@/services/remote-config/client';
import { recordParrotCheck, recordPetcamUpload, recordPetcamUploadFailure } from '@/services/telemetry/client';

type ClipUriPromise = Promise<string | null>;

interface PendingEvent {
	kind: PetcamEventKind;
	photoUri: string;
	occurredAt: string;
	clip: ClipUriPromise | null;
	idempotencyKey: string;
	issuedUpload: { upload: PetcamEventUpload; expiresAt: number } | null;
}

interface PendingVideo {
	eventId: string;
	clip: ClipUriPromise;
}

interface ParrotWatcherOptions {
	sessionId: string;
	stream: MediaStream;
	loadPetcamEvents: () => Promise<SessionPetcamEvent[]>;
	issuePetcamEventUpload: (variables: {
		id: string;
		uri: string;
		data: { kind: PetcamEventKind; occurred_at: string };
		idempotencyKey: string;
	}) => Promise<PetcamEventUpload>;
	uploadPetcamPhoto: (variables: { upload: Upload; uri: string }) => Promise<void>;
	uploadPetcamVideo: (variables: { id: string; eventId: string; uri: string }) => Promise<void>;
	onError: (error: unknown) => void;
}

/** 앵무새 검출을 시작하는 함수 */
export const createParrotWatcher = (options: ParrotWatcherOptions) => {
	const checkSettings = getParrotCheck();
	const clipSettings = getParrotVideo();
	const nightSettings = getParrotNightCorrection();
	const cameraVideo = getPetcamVideo();

	const [track] = options.stream.getVideoTracks();

	let watcherClosed = false;
	let parrotChecking = false;
	let videoSending = false;
	let lowLightEnabled = false;
	let parrotUndetected: boolean | null = null;
	let undetectedStreak = 0;
	let firstUndetectedAt: string | null = null;
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

	/** 마지막 이벤트가 앵무새 미검출인지 반환하는 함수 */
	const loadParrotUndetected = async () => {
		const petcamEvents = await options.loadPetcamEvents();
		const lastUploaded = petcamEvents.filter((event) => event.image?.status === 'uploaded').at(-1);

		return lastUploaded?.kind === 'parrot_disappeared';
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

	/** 사진 밝기에 맞춰 카메라 노출을 바꾸는 함수 */
	const syncLowLight = async (brightness: number) => {
		const photoDark = nightSettings.correctionEnabled && brightness < nightSettings.startBrightness;

		if (!track || photoDark === lowLightEnabled) {
			return;
		}

		if (Platform.OS === 'ios') {
			FrameCapture.setLowLight(photoDark, nightSettings.frameRate);
		} else {
			// Android는 프레임 수를 낮추면 노출이 길어짐
			await track.applyConstraints({
				...cameraVideo,
				frameRate: photoDark ? nightSettings.frameRate : cameraVideo.frameRate,
			});
		}

		lowLightEnabled = photoDark;
	};

	/** 앵무새 검출을 반영하는 함수 */
	const applyParrotDetected = (photoUri: string, occurredAt: string) => {
		undetectedStreak = 0;
		firstUndetectedAt = null;

		if (clip) {
			deleteClip(clip);

			clip = null;
		}

		// 미검출 사진 업로드 전에 검출되면 취소
		if (pendingEvent?.kind === 'parrot_disappeared') {
			deleteFileSafely(pendingEvent.photoUri);

			if (pendingEvent.clip) {
				deleteClip(pendingEvent.clip);
			}

			pendingEvent = null;
		}

		if (!parrotUndetected || pendingEvent) {
			deleteFileSafely(photoUri);

			return;
		}

		pendingEvent = {
			kind: 'parrot_appeared',
			photoUri,
			occurredAt,
			clip: null,
			idempotencyKey: randomUUID(),
			issuedUpload: null,
		};
	};

	/** 앵무새 미검출을 반영하는 함수 */
	const applyParrotUndetected = (photoUri: string, occurredAt: string) => {
		// 앵무새 미검출을 보낸 뒤에는 카운트하지 않음
		if (parrotUndetected && !pendingEvent) {
			deleteFileSafely(photoUri);

			return;
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
			deleteFileSafely(photoUri);

			return;
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
	};

	/** 확인 결과를 반영하는 함수 */
	const applyCheckResult = (checkResult: ParrotCheckResult) => {
		const occurredAt = dayjs(checkResult.capturedAt).toISOString();

		// 너무 어두운 사진은 카운트하지 않음
		if (checkResult.brightness < checkSettings.minBrightness) {
			deleteFileSafely(checkResult.uri);
		} else if (checkResult.birdScore >= checkSettings.scoreThreshold) {
			applyParrotDetected(checkResult.uri, occurredAt);
		} else {
			applyParrotUndetected(checkResult.uri, occurredAt);
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
		parrotUndetected = sentEvent.kind === 'parrot_disappeared';

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
			parrotUndetected ??= await loadParrotUndetected();

			if (watcherClosed) {
				return;
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
					applyCheckResult(checkResult);
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

	track?._setVideoEffect(FRAME_CAPTURE_PROCESSOR);

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
