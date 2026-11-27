import { Platform } from 'react-native';

import {
	type PetcamCandidate,
	type PetcamDescription,
	type PetcamIceServer,
	type PetcamMessage,
	type PetcamPeer,
	type PetcamPeerEvents,
	type PetcamPeerEventTarget,
	type PetcamReceiverOptions,
	type PetcamSenderOptions,
	type PetcamSenderPeer,
	type PetcamSignaling,
	type PetcamTurnCredentialIssuer,
	petcamAudioSourceStatsSchema,
	petcamCandidateSchema,
	petcamDescriptionSchema,
	petcamMessageSchema,
	petcamReceivedVideoStatsSchema,
	petcamSentVideoStatsSchema,
} from '@/types/petcam';

import { getSupabase } from '@/lib/supabase';

import type { z } from 'zod';

import type { RealtimeChannel } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import { setAudioModeAsync } from 'expo-audio';
import { randomUUID } from 'expo-crypto';
import {
	type MediaStream,
	type MediaStreamTrack,
	RTCIceCandidate,
	RTCPeerConnection,
	type RTCRtpSender,
	RTCSessionDescription,
} from 'react-native-webrtc';

import { AudioMode } from '@modules/audio-mode/src';

import { PETCAM_AUDIO_LEVEL_INTERVAL_MS, PETCAM_ICE_SERVERS } from '@/config/policy';
import { BITS_PER_BYTE } from '@/config/units';
import {
	getPetcamConnectTimeoutMs,
	getPetcamMaxBitrate,
	getPetcamStatsIntervalMs,
} from '@/services/remote-config/client';
import { reportError } from '@/services/telemetry/client';

const BROADCAST_EVENT = 'petcam';

const closingChannels = new Map<string, Promise<unknown>>();

interface SentBytes {
	bytesSent: number;
	readAt: number;
}

interface EarlyCandidate {
	offerId: string;
	candidate: PetcamCandidate;
}

/** MediaStream 닫기 함수 */
export const closeMediaStream = (stream: MediaStream) => {
	stream.getTracks().forEach((mediaTrack) => mediaTrack.stop());
	stream.release();
};

/** signaling 채널 연결 함수 */
const openSignaling = (
	sessionId: string,
	onMessage: (message: PetcamMessage) => void,
	onReady: () => void,
	onError: (error: unknown) => void,
): PetcamSignaling => {
	const supabase = getSupabase();

	let channel: RealtimeChannel | null = null;
	let topic: string | null = null;
	let channelClosed = false;

	/** Realtime 채널 구독 함수 */
	const subscribeChannel = async () => {
		const { data: sessionData } = await supabase.auth.getSession();
		const userId = sessionData.session?.user.id;

		if (!userId) {
			throw new Error('Petcam requires a signed-in user');
		}

		const channelTopic = `petcam:${userId}:${sessionId}`;

		await closingChannels.get(channelTopic);
		await supabase.realtime.setAuth();

		if (channelClosed) {
			return;
		}

		topic = channelTopic;
		channel = supabase.channel(channelTopic, {
			config: { private: true, broadcast: { self: false } },
		});

		channel
			.on('broadcast', { event: BROADCAST_EVENT }, ({ payload }) => {
				const parsed = petcamMessageSchema.safeParse(payload);

				if (!parsed.success) {
					reportError(parsed.error, 'petcam_message');

					return;
				}

				onMessage(parsed.data);
			})
			.subscribe((status, error) => {
				if (status === 'SUBSCRIBED') {
					onReady();
				} else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
					onError(error ?? new Error(`Petcam channel ${status}`));
				}
			});
	};

	void subscribeChannel().catch(onError);

	return {
		/** signaling 메시지 전송 함수 */
		send: (message) => {
			void channel
				?.send({ type: 'broadcast', event: BROADCAST_EVENT, payload: message })
				.then((sendStatus) => {
					if (sendStatus !== 'ok') {
						onError(new Error(`Petcam message ${sendStatus}`));
					}
				})
				.catch((error: unknown) => onError(error));
		},
		/** signaling 채널 종료 함수 */
		close: () => {
			channelClosed = true;

			if (!channel || !topic) {
				return;
			}

			const channelTopic = topic;
			const channelClosing: Promise<unknown> = supabase
				.removeChannel(channel)
				.catch((error: unknown) => onError(error))
				.finally(() => {
					if (closingChannels.get(channelTopic) === channelClosing) {
						closingChannels.delete(channelTopic);
					}
				});

			closingChannels.set(channelTopic, channelClosing);
		},
	};
};

/** ICE 서버 목록을 반환하는 함수 */
const fetchIceServers = async (issueTurnCredential: PetcamTurnCredentialIssuer, onError: (error: unknown) => void) => {
	try {
		const { ice_servers: iceServers } = await issueTurnCredential();

		return iceServers;
	} catch (e) {
		onError(e);

		return [...PETCAM_ICE_SERVERS];
	}
};

/** peer 이벤트 구독 함수 */
const addPeerListener = <Type extends keyof PetcamPeerEvents>(
	connection: RTCPeerConnection,
	type: Type,
	listener: (event: PetcamPeerEvents[Type]) => void,
) => {
	(connection as unknown as PetcamPeerEventTarget).addEventListener(type, listener);
};

/** peer의 통계를 반환하는 함수 */
const readStats = async <Stats>(connection: RTCPeerConnection, schema: z.ZodType<Stats>) => {
	const reports: Map<string, unknown> = await connection.getStats();

	return (
		[...reports.values()].map((report) => schema.safeParse(report)).find((parsed) => parsed.success)?.data ?? null
	);
};

/** sender 최대 비트레이트 설정 함수 */
const limitBitrate = (sender: RTCRtpSender, maxBitrate: number) => {
	const parameters = sender.getParameters();

	// setter 값만 toJSON으로 전송됨
	parameters.encodings.forEach((encoding) => {
		encoding.maxBitrate = maxBitrate;
	});

	return sender.setParameters(parameters);
};

/** sender 송신 여부 변경 함수 */
const setSenderActive = (sender: RTCRtpSender, active: boolean) => {
	const parameters = sender.getParameters();

	// 트랙이 없어도 active면 마이크 녹음이 전송됨
	parameters.encodings.forEach((encoding) => {
		encoding.active = active;
	});

	return sender.setParameters(parameters);
};

/** peer 연결을 만드는 함수 */
const createPeer = (
	iceServers: PetcamIceServer[],
	onCandidate: (candidate: PetcamCandidate) => void,
	onError: (error: unknown) => void,
): PetcamPeer => {
	const connection = new RTCPeerConnection({ iceServers });

	// 적용을 기다리는 candidate
	let pendingCandidates: PetcamCandidate[] = [];
	let remoteDescriptionSet = false;

	/** ICE candidate 적용 함수 */
	const addIceCandidate = (candidate: PetcamCandidate) => {
		void connection.addIceCandidate(new RTCIceCandidate(candidate)).catch((error: unknown) => onError(error));
	};

	addPeerListener(connection, 'icecandidate', (event) => {
		if (event.candidate) {
			onCandidate(petcamCandidateSchema.parse(event.candidate.toJSON()));
		}
	});
	addPeerListener(connection, 'connectionstatechange', () => {
		// iOS 출력을 스피커로 변경
		if (connection.connectionState === 'connected' && Platform.OS === 'ios') {
			void setAudioModeAsync({
				playsInSilentMode: true,
				allowsRecording: true,
				shouldRouteThroughEarpiece: false,
			}).catch(onError);
		}
	});

	return {
		connection,
		/** 원격 description 적용 함수 */
		setRemoteDescription: async (description) => {
			await connection.setRemoteDescription(new RTCSessionDescription(description));

			remoteDescriptionSet = true;
			pendingCandidates.forEach(addIceCandidate);
			pendingCandidates = [];
		},
		/** candidate 추가 함수 */
		addCandidate: (candidate) => {
			if (remoteDescriptionSet) {
				addIceCandidate(candidate);
			} else {
				pendingCandidates = [...pendingCandidates, candidate];
			}
		},
		/** peer 연결 종료 함수 */
		close: () => {
			connection.close();
		},
	};
};

/** 카메라 영상 전송 연결을 만드는 함수 */
export const createPetcamSender = ({
	sessionId,
	issueTurnCredential,
	onCameraRequest,
	onViewerConnectedChange,
	onVideoStats,
	onError,
}: PetcamSenderOptions) => {
	const connectTimeoutMs = getPetcamConnectTimeoutMs();
	const maxBitrate = getPetcamMaxBitrate();

	const peers = new Map<string, PetcamSenderPeer>();
	const sentBytes = new Map<string, SentBytes>();

	let viewerIds: string[] = [];
	let cameraStream: MediaStream | null = null;
	let audioTrack: MediaStreamTrack | null = null;
	let viewerConnected = false;
	let permissionDenied = false;
	let senderClosed = false;

	/** Viewer 연결 여부 갱신 함수 */
	const updateViewerConnected = () => {
		const connected = [...peers.values()].some(({ peer }) => peer.connection.connectionState === 'connected');

		if (connected !== viewerConnected) {
			viewerConnected = connected;

			onViewerConnectedChange(connected);
		}
	};

	/** Viewer와의 peer 닫기 함수 */
	const closePeer = (viewerId: string) => {
		const senderPeer = peers.get(viewerId);

		if (!senderPeer) {
			return;
		}

		clearTimeout(senderPeer.connectTimer);
		senderPeer.peer.close();
		peers.delete(viewerId);
		sentBytes.delete(viewerId);

		updateViewerConnected();
	};

	/** 연결된 Viewer별 영상 통계 전달 함수 */
	const reportVideoStats = () => {
		return Promise.all(
			[...peers]
				.filter(([, { peer }]) => peer.connection.connectionState === 'connected')
				.map(async ([viewerId, { peer }]) => {
					const stats = await readStats(peer.connection, petcamSentVideoStatsSchema);

					if (!stats) {
						return;
					}

					const readAt = dayjs().valueOf();
					const previous = sentBytes.get(viewerId);

					sentBytes.set(viewerId, { bytesSent: stats.bytesSent, readAt });

					onVideoStats({
						frameRate: stats.framesPerSecond,
						frameWidth: stats.frameWidth,
						frameHeight: stats.frameHeight,
						bitrate: previous
							? ((stats.bytesSent - previous.bytesSent) * BITS_PER_BYTE) / (readAt - previous.readAt)
							: null,
						qualityLimitation: stats.qualityLimitationReason ?? null,
					});
				}),
		);
	};

	const statsTimer = setInterval(() => void reportVideoStats().catch(onError), getPetcamStatsIntervalMs());

	/** Viewer 제거 함수 */
	const removeViewer = (viewerId: string) => {
		viewerIds = viewerIds.filter((id) => id !== viewerId);

		closePeer(viewerId);
	};

	/** 카메라 상태 전송 함수 */
	const sendState = () => {
		signaling.send({ type: 'state', cameraOn: cameraStream !== null, permissionDenied });
	};

	/** Viewer에게 offer를 보내는 함수 */
	const sendOffer = async (viewerId: string, stream: MediaStream) => {
		const iceServers = await fetchIceServers(issueTurnCredential, onError);

		// 그 사이 상태가 변경되면 중단
		if (senderClosed || cameraStream !== stream || !viewerIds.includes(viewerId)) {
			return;
		}

		closePeer(viewerId);

		const offerId = randomUUID();
		const peer = createPeer(
			iceServers,
			(candidate) => signaling.send({ type: 'candidate', viewerId, offerId, from: 'station', candidate }),
			onError,
		);

		const videoSenders = stream.getVideoTracks().map((track) => peer.connection.addTrack(track, stream));

		// 소리 송수신 transceiver
		const { sender: audioSender } = peer.connection.addTransceiver('audio', {
			direction: 'sendrecv',
			streams: [stream],
		});

		peers.set(viewerId, {
			peer,
			offerId,
			audioSender,
			// 연결되지 않은 Viewer 제거
			connectTimer: setTimeout(() => {
				if (peers.get(viewerId)?.peer === peer && peer.connection.connectionState !== 'connected') {
					removeViewer(viewerId);
				}
			}, connectTimeoutMs),
		});

		addPeerListener(peer.connection, 'connectionstatechange', () => {
			if (peer.connection.connectionState === 'failed' && peers.get(viewerId)?.peer === peer) {
				removeViewer(viewerId);
			}

			updateViewerConnected();
		});

		if (audioTrack) {
			void audioSender.replaceTrack(audioTrack).catch(onError);
		}

		await Promise.all([
			...videoSenders.map((videoSender) => limitBitrate(videoSender, maxBitrate.video)),
			limitBitrate(audioSender, maxBitrate.audio),
			setSenderActive(audioSender, !!audioTrack),
		]).catch(onError);

		const description = petcamDescriptionSchema.parse(await peer.connection.createOffer({}));

		await peer.connection.setLocalDescription(description);

		signaling.send({ type: 'offer', viewerId, offerId, description });
	};

	const signaling = openSignaling(
		sessionId,
		(message) => {
			if (message.type === 'viewer-join') {
				viewerIds = [...viewerIds.filter((id) => id !== message.viewerId), message.viewerId];

				sendState();

				if (cameraStream) {
					void sendOffer(message.viewerId, cameraStream).catch(onError);
				}
			} else if (message.type === 'viewer-leave') {
				removeViewer(message.viewerId);
			} else if (message.type === 'answer') {
				const senderPeer = peers.get(message.viewerId);

				if (senderPeer?.offerId === message.offerId) {
					void senderPeer.peer.setRemoteDescription(message.description).catch(onError);
				}
			} else if (message.type === 'candidate' && message.from === 'viewer') {
				const senderPeer = peers.get(message.viewerId);

				if (senderPeer?.offerId === message.offerId) {
					senderPeer.peer.addCandidate(message.candidate);
				}
			} else if (message.type === 'camera-set') {
				onCameraRequest(message.cameraOn);
			}
		},
		() => {
			signaling.send({ type: 'station-ready' });

			sendState();
		},
		onError,
	);

	return {
		/** 보낼 카메라 영상 변경 함수 */
		setStream: (stream: MediaStream | null) => {
			[...peers.keys()].forEach(closePeer);

			cameraStream = stream;
			permissionDenied = false;

			sendState();

			if (stream) {
				viewerIds.forEach((viewerId) => void sendOffer(viewerId, stream).catch(onError));
			}
		},
		/** 보낼 마이크 소리 변경 함수 */
		setAudioTrack: (track: MediaStreamTrack | null) => {
			audioTrack = track;

			AudioMode?.setCommunicationMode(!!track);

			peers.forEach(({ audioSender }) => {
				void audioSender.replaceTrack(track).catch(onError);
				void setSenderActive(audioSender, !!track).catch(onError);
			});
		},
		/** 카메라 권한 없음을 알리는 함수 */
		reportPermissionDenied: () => {
			permissionDenied = true;

			sendState();
		},
		/** 영상 전송 종료 함수 */
		close: () => {
			senderClosed = true;

			AudioMode?.setCommunicationMode(false);

			clearInterval(statsTimer);

			[...peers.keys()].forEach(closePeer);

			signaling.close();
		},
	};
};

export type PetcamSender = ReturnType<typeof createPetcamSender>;

/** 카메라 영상 수신 연결을 만드는 함수 */
export const createPetcamReceiver = ({
	sessionId,
	issueTurnCredential,
	onState,
	onStream,
	onVideoStats,
	onAudioLevel,
	onError,
}: PetcamReceiverOptions) => {
	const viewerId = randomUUID();

	let peer: PetcamPeer | null = null;
	let offerId: string | null = null;
	// peer보다 먼저 도착한 candidate
	let earlyCandidates: EarlyCandidate[] = [];
	let audioTrack: MediaStreamTrack | null = null;
	let audioSender: RTCRtpSender | null = null;
	let audioLevelTimer: ReturnType<typeof setInterval> | null = null;

	/** 수신 중인 peer 닫기 함수 */
	const closePeer = () => {
		offerId = null;
		earlyCandidates = [];
		audioSender = null;

		AudioMode?.setCommunicationMode(false);

		peer?.close();
		peer = null;

		onStream(null);
	};

	/** 수신 중인 영상 통계 전달 함수 */
	const reportVideoStats = async () => {
		if (peer?.connection.connectionState !== 'connected') {
			return;
		}

		const stats = await readStats(peer.connection, petcamReceivedVideoStatsSchema);

		if (stats) {
			onVideoStats({
				frameRate: stats.framesPerSecond,
				frameWidth: stats.frameWidth,
				frameHeight: stats.frameHeight,
				bitrate: null,
				qualityLimitation: null,
			});
		}
	};

	const statsTimer = setInterval(() => void reportVideoStats().catch(onError), getPetcamStatsIntervalMs());

	/** 보내는 마이크 소리 크기 전달 함수 */
	const reportAudioLevel = async () => {
		if (peer?.connection.connectionState !== 'connected') {
			return;
		}

		const stats = await readStats(peer.connection, petcamAudioSourceStatsSchema);

		if (stats) {
			onAudioLevel(stats.audioLevel);
		}
	};

	/** 소리 크기 폴링 중지 함수 */
	const stopAudioLevelPolling = () => {
		if (audioLevelTimer) {
			clearInterval(audioLevelTimer);
			audioLevelTimer = null;
		}
	};

	/** offer에 answer를 보내는 함수 */
	const sendAnswer = async (acceptedOfferId: string, description: PetcamDescription) => {
		const arrivedCandidates = earlyCandidates.filter(
			(earlyCandidate) => earlyCandidate.offerId === acceptedOfferId,
		);

		closePeer();

		offerId = acceptedOfferId;
		earlyCandidates = arrivedCandidates;

		const iceServers = await fetchIceServers(issueTurnCredential, onError);

		// 새 offer가 오면 중단
		if (offerId !== acceptedOfferId) {
			return;
		}

		const createdPeer = createPeer(
			iceServers,
			(candidate) =>
				signaling.send({ type: 'candidate', viewerId, offerId: acceptedOfferId, from: 'viewer', candidate }),
			onError,
		);

		peer = createdPeer;

		earlyCandidates.forEach((earlyCandidate) => createdPeer.addCandidate(earlyCandidate.candidate));
		earlyCandidates = [];

		addPeerListener(createdPeer.connection, 'track', (event) => {
			const [stream] = event.streams;

			if (stream && peer === createdPeer) {
				onStream(stream);
			}
		});
		addPeerListener(createdPeer.connection, 'connectionstatechange', () => {
			if (peer !== createdPeer) {
				return;
			}

			// 연결되면 통화 모드로 변경
			if (createdPeer.connection.connectionState === 'connected') {
				AudioMode?.setCommunicationMode(true);
			} else if (createdPeer.connection.connectionState === 'failed') {
				closePeer();

				signaling.send({ type: 'viewer-join', viewerId });
			}
		});

		await createdPeer.setRemoteDescription(description);

		// answer 전에 송신 방향 설정
		const audioTransceiver = createdPeer.connection
			.getTransceivers()
			.find((transceiver) => transceiver.receiver.track?.kind === 'audio');

		if (audioTransceiver && peer === createdPeer) {
			audioTransceiver.direction = 'sendrecv';
			audioSender = audioTransceiver.sender;

			if (audioTrack) {
				void audioSender.replaceTrack(audioTrack).catch(onError);
			}
		}

		const localDescription = petcamDescriptionSchema.parse(await createdPeer.connection.createAnswer());

		await createdPeer.connection.setLocalDescription(localDescription);

		// encodings가 answer 설정 뒤에 생김
		if (audioTransceiver && peer === createdPeer) {
			await setSenderActive(audioTransceiver.sender, !!audioTrack).catch(onError);
		}

		signaling.send({ type: 'answer', viewerId, offerId: acceptedOfferId, description: localDescription });
	};

	const signaling = openSignaling(
		sessionId,
		(message) => {
			if (message.type === 'station-ready') {
				closePeer();

				signaling.send({ type: 'viewer-join', viewerId });
			} else if (message.type === 'state') {
				onState({ cameraOn: message.cameraOn, permissionDenied: message.permissionDenied });

				if (!message.cameraOn) {
					closePeer();
				}
			} else if (message.type === 'offer' && message.viewerId === viewerId) {
				void sendAnswer(message.offerId, message.description).catch(onError);
			} else if (message.type === 'candidate' && message.from === 'station' && message.viewerId === viewerId) {
				if (peer && message.offerId === offerId) {
					peer.addCandidate(message.candidate);
				} else {
					earlyCandidates = [...earlyCandidates, { offerId: message.offerId, candidate: message.candidate }];
				}
			}
		},
		() => signaling.send({ type: 'viewer-join', viewerId }),
		onError,
	);

	return {
		/** Station 카메라 상태 요청 함수 */
		setCamera: (cameraOn: boolean) => signaling.send({ type: 'camera-set', cameraOn }),
		/** 보낼 마이크 소리 변경 함수 */
		setAudioTrack: (track: MediaStreamTrack | null) => {
			audioTrack = track;

			if (audioSender) {
				void audioSender.replaceTrack(track).catch(onError);
				void setSenderActive(audioSender, !!track).catch(onError);
			}

			stopAudioLevelPolling();

			if (track) {
				audioLevelTimer = setInterval(
					() => void reportAudioLevel().catch(onError),
					PETCAM_AUDIO_LEVEL_INTERVAL_MS,
				);
			}
		},
		/** 영상 수신 종료 함수 */
		close: () => {
			clearInterval(statsTimer);
			stopAudioLevelPolling();

			signaling.send({ type: 'viewer-leave', viewerId });

			offerId = null;

			AudioMode?.setCommunicationMode(false);

			peer?.close();
			peer = null;

			signaling.close();
		},
	};
};

export type PetcamReceiver = ReturnType<typeof createPetcamReceiver>;
