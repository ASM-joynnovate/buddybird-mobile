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
import { randomUUID } from 'expo-crypto';
import {
	type MediaStream,
	type MediaStreamTrack,
	RTCIceCandidate,
	RTCPeerConnection,
	RTCSessionDescription,
} from 'react-native-webrtc';

import { PETCAM_CONNECT_TIMEOUT_MS, PETCAM_ICE_SERVERS, PETCAM_STATS_INTERVAL_MS } from '@/config';

const BROADCAST_EVENT = 'petcam';
const BITS_PER_BYTE = 8;

// 닫는 중인 채널
const closingChannels = new Map<string, Promise<unknown>>();

/** signaling 채널을 여는 함수 */
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
		const { data } = await supabase.auth.getSession();
		const userId = data.session?.user.id;

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

				if (parsed.success) {
					onMessage(parsed.data);
				}
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
		send: (message) => {
			void channel
				?.send({ type: 'broadcast', event: BROADCAST_EVENT, payload: message })
				.then((result) => {
					if (result !== 'ok') {
						onError(new Error(`Petcam message ${result}`));
					}
				})
				.catch((error: unknown) => onError(error));
		},
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
const fetchIceServers = async (
	issueTurnCredential: PetcamTurnCredentialIssuer,
	onError: (error: unknown) => void,
): Promise<PetcamIceServer[]> => {
	try {
		const { ice_servers: iceServers } = await issueTurnCredential();

		return iceServers;
	} catch (error) {
		onError(error);

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

/** peer의 영상 통계를 반환하는 함수 */
const readVideoStats = async <Stats>(connection: RTCPeerConnection, schema: z.ZodType<Stats>) => {
	const reports: Map<string, unknown> = await connection.getStats();

	return (
		[...reports.values()].map((report) => schema.safeParse(report)).find((parsed) => parsed.success)?.data ?? null
	);
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
	const applyCandidate = (candidate: PetcamCandidate) => {
		void connection.addIceCandidate(new RTCIceCandidate(candidate)).catch((error: unknown) => onError(error));
	};

	addPeerListener(connection, 'icecandidate', (event) => {
		if (event.candidate) {
			onCandidate(petcamCandidateSchema.parse(event.candidate.toJSON()));
		}
	});

	return {
		connection,
		setRemote: async (description) => {
			await connection.setRemoteDescription(new RTCSessionDescription(description));

			remoteDescriptionSet = true;
			pendingCandidates.forEach(applyCandidate);
			pendingCandidates = [];
		},
		addCandidate: (candidate) => {
			if (remoteDescriptionSet) {
				applyCandidate(candidate);
			} else {
				pendingCandidates = [...pendingCandidates, candidate];
			}
		},
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
	const peers = new Map<string, PetcamSenderPeer>();
	const sentBytes = new Map<string, { bytesSent: number; readAt: number }>();

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
					const stats = await readVideoStats(peer.connection, petcamSentVideoStatsSchema);

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

	const statsTimer = setInterval(() => void reportVideoStats().catch(onError), PETCAM_STATS_INTERVAL_MS);

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

		// 그 사이 상태가 바뀌면 중단
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

		stream.getTracks().forEach((track) => {
			peer.connection.addTrack(track, stream);
		});

		// 소리 전송용 transceiver
		const { sender: audioSender } = peer.connection.addTransceiver('audio', {
			direction: 'sendonly',
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
			}, PETCAM_CONNECT_TIMEOUT_MS),
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
					void senderPeer.peer.setRemote(message.description).catch(onError);
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
		/** 보낼 카메라 영상을 바꾸는 함수 */
		setStream: (stream: MediaStream | null) => {
			[...peers.keys()].forEach(closePeer);

			cameraStream = stream;
			permissionDenied = false;

			sendState();

			if (stream) {
				viewerIds.forEach((viewerId) => void sendOffer(viewerId, stream).catch(onError));
			}
		},
		/** 보낼 마이크 소리를 바꾸는 함수 */
		setAudioTrack: (track: MediaStreamTrack | null) => {
			audioTrack = track;

			peers.forEach(({ audioSender }) => void audioSender.replaceTrack(track).catch(onError));
		},
		/** 카메라 권한 없음을 알리는 함수 */
		reportPermissionDenied: () => {
			permissionDenied = true;

			sendState();
		},
		close: () => {
			senderClosed = true;

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
	onError,
}: PetcamReceiverOptions) => {
	const viewerId = randomUUID();

	let peer: PetcamPeer | null = null;
	let offerId: string | null = null;
	// peer보다 먼저 도착한 candidate
	let earlyCandidates: { offerId: string; candidate: PetcamCandidate }[] = [];

	/** 수신 중인 peer 닫기 함수 */
	const closePeer = () => {
		offerId = null;
		earlyCandidates = [];

		peer?.close();
		peer = null;

		onStream(null);
	};

	/** 수신 중인 영상 통계 전달 함수 */
	const reportVideoStats = async () => {
		if (peer?.connection.connectionState !== 'connected') {
			return;
		}

		const stats = await readVideoStats(peer.connection, petcamReceivedVideoStatsSchema);

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

	const statsTimer = setInterval(() => void reportVideoStats().catch(onError), PETCAM_STATS_INTERVAL_MS);

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
			if (createdPeer.connection.connectionState === 'failed' && peer === createdPeer) {
				closePeer();

				signaling.send({ type: 'viewer-join', viewerId });
			}
		});

		await createdPeer.setRemote(description);

		const localDescription = petcamDescriptionSchema.parse(await createdPeer.connection.createAnswer());

		await createdPeer.connection.setLocalDescription(localDescription);

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
		close: () => {
			clearInterval(statsTimer);

			signaling.send({ type: 'viewer-leave', viewerId });

			offerId = null;

			peer?.close();
			peer = null;

			signaling.close();
		},
	};
};

export type PetcamReceiver = ReturnType<typeof createPetcamReceiver>;
