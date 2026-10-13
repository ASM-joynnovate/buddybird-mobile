import {
	type PetcamCandidate,
	type PetcamDescription,
	type PetcamIceServer,
	type PetcamMessage,
	type PetcamPeer,
	type PetcamPeerEventTarget,
	type PetcamPeerEvents,
	type PetcamSignaling,
	type PetcamStationPeer,
	type PetcamTurnCredential,
	type StationPetcamOptions,
	type ViewerPetcamOptions,
	petcamCandidateSchema,
	petcamDescriptionSchema,
	petcamMessageSchema,
} from '@/types/apis/petcam';

import { getSupabase } from '@/lib/supabase';

import type { RealtimeChannel } from '@supabase/supabase-js';
import { randomUUID } from 'expo-crypto';
import { type MediaStream, RTCIceCandidate, RTCPeerConnection, RTCSessionDescription } from 'react-native-webrtc';

import { PETCAM_CONNECT_TIMEOUT_MS, PETCAM_ICE_SERVERS } from '@/config';

const BROADCAST_EVENT = 'petcam';

// 같은 채널을 닫는 중에 다시 열면 닫히는 채널이 재사용되어 구독되지 않으므로, 닫기가 끝날 때까지 대기
const closingChannels = new Map<string, Promise<unknown>>();

/** 세션별 Supabase Realtime 채널로 연결 정보를 주고받는 함수 */
const openSignaling = (
	sessionId: string,
	onMessage: (message: PetcamMessage) => void,
	onReady: () => void,
	onError: (error: unknown) => void,
): PetcamSignaling => {
	const supabase = getSupabase();

	let channel: RealtimeChannel | null = null;
	let topic: string | null = null;
	let closed = false;

	/** 본인 계정의 세션 채널을 여는 함수, 채널 이름에 사용자 id가 들어가야 접근 규칙을 통과 */
	const open = async () => {
		const { data } = await supabase.auth.getSession();
		const userId = data.session?.user.id;

		if (!userId) {
			throw new Error('Petcam requires a signed-in user');
		}

		const channelTopic = `petcam:${userId}:${sessionId}`;

		await closingChannels.get(channelTopic);
		await supabase.realtime.setAuth();

		if (closed) {
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

	void open().catch(onError);

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
			closed = true;

			if (!channel || !topic) {
				return;
			}

			const channelTopic = topic;
			const closing: Promise<unknown> = supabase
				.removeChannel(channel)
				.catch((error: unknown) => onError(error))
				.finally(() => {
					if (closingChannels.get(channelTopic) === closing) {
						closingChannels.delete(channelTopic);
					}
				});

			closingChannels.set(channelTopic, closing);
		},
	};
};

/** 영상 중계(TURN) 접속 정보를 받아 오는 함수, 받지 못하면 공개 STUN만 사용 */
const fetchIceServers = async (
	issueTurnCredential: () => Promise<PetcamTurnCredential>,
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

/** 영상 연결의 이벤트를 듣는 함수 */
const listen = <Type extends keyof PetcamPeerEvents>(
	connection: RTCPeerConnection,
	type: Type,
	listener: (event: PetcamPeerEvents[Type]) => void,
) => {
	(connection as unknown as PetcamPeerEventTarget).addEventListener(type, listener);
};

/** 상대 기기와의 영상 연결을 만드는 함수 */
const createPeer = (
	iceServers: PetcamIceServer[],
	onCandidate: (candidate: PetcamCandidate) => void,
	onError: (error: unknown) => void,
): PetcamPeer => {
	const connection = new RTCPeerConnection({ iceServers });

	// 상대 연결 정보가 적용되기 전에 도착한 후보는 모아 두었다가 적용
	let pendingCandidates: PetcamCandidate[] = [];
	let remoteReady = false;

	/** ICE 후보 적용 함수 */
	const applyCandidate = (candidate: PetcamCandidate) => {
		void connection.addIceCandidate(new RTCIceCandidate(candidate)).catch((error: unknown) => onError(error));
	};

	listen(connection, 'icecandidate', (event) => {
		if (event.candidate) {
			onCandidate(petcamCandidateSchema.parse(event.candidate.toJSON()));
		}
	});

	return {
		connection,
		setRemote: async (description) => {
			await connection.setRemoteDescription(new RTCSessionDescription(description));

			remoteReady = true;
			pendingCandidates.forEach(applyCandidate);
			pendingCandidates = [];
		},
		addCandidate: (candidate) => {
			if (remoteReady) {
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

/** 학습 중인 기기에서 카메라 영상을 보내는 연결을 만드는 함수 */
export const createStationPetcam = ({
	sessionId,
	issueTurnCredential,
	onCameraRequest,
	onError,
}: StationPetcamOptions) => {
	const peers = new Map<string, PetcamStationPeer>();

	let viewerIds: string[] = [];
	let stream: MediaStream | null = null;
	let permissionDenied = false;
	let turnedOnRemotely = false;
	let closed = false;

	/** 보는 기기와의 연결 닫기 함수 */
	const closePeer = (viewerId: string) => {
		const current = peers.get(viewerId);

		if (!current) {
			return;
		}

		clearTimeout(current.connectTimer);
		current.peer.close();
		peers.delete(viewerId);
	};

	/** 떠난 보는 기기를 정리하고, 원격으로 켠 카메라는 보는 기기가 없으면 끄는 함수 */
	const removeViewer = (viewerId: string) => {
		viewerIds = viewerIds.filter((id) => id !== viewerId);

		closePeer(viewerId);

		if (viewerIds.length === 0 && turnedOnRemotely) {
			turnedOnRemotely = false;

			onCameraRequest(false);
		}
	};

	/** 카메라 상태 전송 함수 */
	const sendState = () => {
		signaling.send({ type: 'state', cameraOn: stream !== null, permissionDenied });
	};

	/** 보는 기기에 영상 연결을 제안하는 함수 */
	const offer = async (viewerId: string, media: MediaStream) => {
		const iceServers = await fetchIceServers(issueTurnCredential, onError);

		// 접속 정보를 받는 사이 카메라가 꺼졌거나 보는 기기가 떠났으면 연결하지 않음
		if (closed || stream !== media || !viewerIds.includes(viewerId)) {
			return;
		}

		closePeer(viewerId);

		const offerId = randomUUID();
		const peer = createPeer(
			iceServers,
			(candidate) => signaling.send({ type: 'candidate', viewerId, offerId, from: 'station', candidate }),
			onError,
		);

		peers.set(viewerId, {
			peer,
			offerId,
			// 응답이 오지 않는 연결은 실패 상태가 되지 않으므로, 일정 시간 안에 연결되지 않으면 떠난 것으로 처리
			connectTimer: setTimeout(() => {
				if (peers.get(viewerId)?.peer === peer && peer.connection.connectionState !== 'connected') {
					removeViewer(viewerId);
				}
			}, PETCAM_CONNECT_TIMEOUT_MS),
		});

		listen(peer.connection, 'connectionstatechange', () => {
			if (peer.connection.connectionState === 'failed' && peers.get(viewerId)?.peer === peer) {
				removeViewer(viewerId);
			}
		});

		media.getTracks().forEach((track) => {
			peer.connection.addTrack(track, media);
		});

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

				if (stream) {
					void offer(message.viewerId, stream).catch(onError);
				}
			} else if (message.type === 'viewer-leave') {
				removeViewer(message.viewerId);
			} else if (message.type === 'answer') {
				const current = peers.get(message.viewerId);

				if (current?.offerId === message.offerId) {
					void current.peer.setRemote(message.description).catch(onError);
				}
			} else if (message.type === 'candidate' && message.from === 'viewer') {
				const current = peers.get(message.viewerId);

				if (current?.offerId === message.offerId) {
					current.peer.addCandidate(message.candidate);
				}
			} else if (message.type === 'camera-set') {
				turnedOnRemotely = message.on && (turnedOnRemotely || stream === null);

				onCameraRequest(message.on);
			}
		},
		() => {
			signaling.send({ type: 'station-ready' });

			sendState();
		},
		onError,
	);

	return {
		/** 보낼 카메라 영상을 바꾸는 함수, 카메라를 끄면 null */
		setStream: (media: MediaStream | null) => {
			[...peers.keys()].forEach(closePeer);

			stream = media;
			permissionDenied = false;

			if (!media) {
				turnedOnRemotely = false;
			}

			sendState();

			if (media) {
				viewerIds.forEach((viewerId) => void offer(viewerId, media).catch(onError));
			}
		},
		/** 카메라 권한이 없어 켜지 못했음을 보는 기기에 알리는 함수 */
		reportPermissionDenied: () => {
			permissionDenied = true;
			turnedOnRemotely = false;

			sendState();
		},
		close: () => {
			closed = true;

			[...peers.keys()].forEach(closePeer);

			signaling.close();
		},
	};
};

export type StationPetcam = ReturnType<typeof createStationPetcam>;

/** 다른 기기에서 진행 중인 학습의 카메라 영상을 받는 연결을 만드는 함수 */
export const createViewerPetcam = ({
	sessionId,
	issueTurnCredential,
	onState,
	onStream,
	onError,
}: ViewerPetcamOptions) => {
	const viewerId = randomUUID();

	let peer: PetcamPeer | null = null;
	let offerId: string | null = null;
	// 연결이 만들어지기 전에 도착한 후보는 제안별로 모아 두었다가 적용
	let earlyCandidates: { offerId: string; candidate: PetcamCandidate }[] = [];

	/** 받고 있던 영상 연결 닫기 함수 */
	const closePeer = () => {
		offerId = null;
		earlyCandidates = [];

		peer?.close();
		peer = null;

		onStream(null);
	};

	/** 학습 중인 기기가 제안한 영상 연결을 수락하는 함수 */
	const answer = async (acceptedOfferId: string, description: PetcamDescription) => {
		const arrivedCandidates = earlyCandidates.filter((early) => early.offerId === acceptedOfferId);

		closePeer();

		offerId = acceptedOfferId;
		earlyCandidates = arrivedCandidates;

		const iceServers = await fetchIceServers(issueTurnCredential, onError);

		// 접속 정보를 받는 사이 새 제안이 왔거나 연결이 닫혔으면 이전 제안은 버림
		if (offerId !== acceptedOfferId) {
			return;
		}

		const created = createPeer(
			iceServers,
			(candidate) =>
				signaling.send({ type: 'candidate', viewerId, offerId: acceptedOfferId, from: 'viewer', candidate }),
			onError,
		);

		peer = created;

		earlyCandidates.forEach((early) => created.addCandidate(early.candidate));
		earlyCandidates = [];

		listen(created.connection, 'track', (event) => {
			const [media] = event.streams;

			if (media && peer === created) {
				onStream(media);
			}
		});
		listen(created.connection, 'connectionstatechange', () => {
			if (created.connection.connectionState === 'failed' && peer === created) {
				closePeer();

				signaling.send({ type: 'viewer-join', viewerId });
			}
		});

		await created.setRemote(description);

		const localDescription = petcamDescriptionSchema.parse(await created.connection.createAnswer());

		await created.connection.setLocalDescription(localDescription);

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
				void answer(message.offerId, message.description).catch(onError);
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
		/** 학습 중인 기기의 카메라를 켜거나 끄도록 요청하는 함수 */
		setCamera: (on: boolean) => signaling.send({ type: 'camera-set', on }),
		close: () => {
			signaling.send({ type: 'viewer-leave', viewerId });

			offerId = null;

			peer?.close();
			peer = null;

			signaling.close();
		},
	};
};
