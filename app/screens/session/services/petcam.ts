import { getSupabase } from '@/lib/supabase';

import { z } from 'zod';

import type { RealtimeChannel } from '@supabase/supabase-js';
import { randomUUID } from 'expo-crypto';
import { type MediaStream, RTCIceCandidate, RTCPeerConnection, RTCSessionDescription } from 'react-native-webrtc';

import { PETCAM_ICE_SERVERS } from '@/config';

const BROADCAST_EVENT = 'petcam';

const descriptionSchema = z.object({ type: z.enum(['offer', 'answer']), sdp: z.string() });
const candidateSchema = z.object({
	candidate: z.string(),
	sdpMLineIndex: z.number().nullable(),
	sdpMid: z.string().nullable(),
});
const messageSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('station-ready') }),
	z.object({ type: z.literal('state'), cameraOn: z.boolean(), permissionDenied: z.boolean() }),
	z.object({ type: z.literal('viewer-join'), viewerId: z.string() }),
	z.object({ type: z.literal('viewer-leave'), viewerId: z.string() }),
	z.object({ type: z.literal('camera-set'), on: z.boolean() }),
	z.object({ type: z.literal('offer'), viewerId: z.string(), description: descriptionSchema }),
	z.object({ type: z.literal('answer'), viewerId: z.string(), description: descriptionSchema }),
	z.object({
		type: z.literal('candidate'),
		viewerId: z.string(),
		from: z.enum(['station', 'viewer']),
		candidate: candidateSchema,
	}),
]);

type PetcamMessage = z.infer<typeof messageSchema>;
type Description = z.infer<typeof descriptionSchema>;
type Candidate = z.infer<typeof candidateSchema>;

export interface PetcamState {
	cameraOn: boolean;
	permissionDenied: boolean;
}

// react-native-webrtc가 이벤트 타입 정의를 배포본에 넣지 않아, 사용하는 이벤트만 직접 정의
interface PeerEvents {
	icecandidate: { candidate: RTCIceCandidate | null };
	track: { streams: MediaStream[] };
	connectionstatechange: object;
}

interface PeerEventTarget {
	addEventListener: <Type extends keyof PeerEvents>(type: Type, listener: (event: PeerEvents[Type]) => void) => void;
}

interface Signaling {
	send: (message: PetcamMessage) => void;
	close: () => void;
}

interface Peer {
	connection: RTCPeerConnection;
	setRemote: (description: Description) => Promise<void>;
	addCandidate: (candidate: Candidate) => void;
	close: () => void;
}

interface StationPetcamOptions {
	sessionId: string;
	onCameraRequest: (on: boolean) => void;
	onError: (error: unknown) => void;
}

interface ViewerPetcamOptions {
	sessionId: string;
	onState: (state: PetcamState) => void;
	onStream: (stream: MediaStream | null) => void;
	onError: (error: unknown) => void;
}

/** 세션별 Supabase Realtime 채널로 연결 정보를 주고받는 함수 */
const openSignaling = (
	sessionId: string,
	onMessage: (message: PetcamMessage) => void,
	onReady: () => void,
	onError: (error: unknown) => void,
): Signaling => {
	const supabase = getSupabase();
	// 채널 권한(BB-658)이 준비되면 private 채널로 전환
	const channel: RealtimeChannel = supabase.channel(`petcam:${sessionId}`, {
		config: { broadcast: { self: false } },
	});

	channel
		.on('broadcast', { event: BROADCAST_EVENT }, ({ payload }) => {
			const parsed = messageSchema.safeParse(payload);

			if (parsed.success) {
				onMessage(parsed.data);
			}
		})
		.subscribe((status, error) => {
			if (status === 'SUBSCRIBED') {
				onReady();
			} else if (status === 'CHANNEL_ERROR') {
				onError(error ?? new Error('Petcam channel error'));
			}
		});

	return {
		send: (message) => {
			void channel
				.send({ type: 'broadcast', event: BROADCAST_EVENT, payload: message })
				.catch((error: unknown) => onError(error));
		},
		close: () => {
			void supabase.removeChannel(channel).catch((error: unknown) => onError(error));
		},
	};
};

/** 영상 연결의 이벤트를 듣는 함수 */
const listen = <Type extends keyof PeerEvents>(
	connection: RTCPeerConnection,
	type: Type,
	listener: (event: PeerEvents[Type]) => void,
) => {
	(connection as unknown as PeerEventTarget).addEventListener(type, listener);
};

/** 상대 기기와의 영상 연결을 만드는 함수 */
const createPeer = (onCandidate: (candidate: Candidate) => void, onError: (error: unknown) => void): Peer => {
	const connection = new RTCPeerConnection({ iceServers: [...PETCAM_ICE_SERVERS] });

	// 상대 연결 정보가 적용되기 전에 도착한 후보는 모아 두었다가 적용
	let pendingCandidates: Candidate[] = [];
	let remoteReady = false;

	/** ICE 후보 적용 함수 */
	const applyCandidate = (candidate: Candidate) => {
		void connection.addIceCandidate(new RTCIceCandidate(candidate)).catch((error: unknown) => onError(error));
	};

	listen(connection, 'icecandidate', (event) => {
		if (event.candidate) {
			onCandidate(candidateSchema.parse(event.candidate.toJSON()));
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
export const createStationPetcam = ({ sessionId, onCameraRequest, onError }: StationPetcamOptions) => {
	const peers = new Map<string, Peer>();

	let viewerIds: string[] = [];
	let stream: MediaStream | null = null;
	let permissionDenied = false;

	/** 보는 기기와의 연결 닫기 함수 */
	const closePeer = (viewerId: string) => {
		peers.get(viewerId)?.close();
		peers.delete(viewerId);
	};

	/** 카메라 상태 전송 함수 */
	const sendState = () => {
		signaling.send({ type: 'state', cameraOn: stream !== null, permissionDenied });
	};

	/** 보는 기기에 영상 연결을 제안하는 함수 */
	const offer = async (viewerId: string, media: MediaStream) => {
		closePeer(viewerId);

		const peer = createPeer(
			(candidate) => signaling.send({ type: 'candidate', viewerId, from: 'station', candidate }),
			onError,
		);

		peers.set(viewerId, peer);

		listen(peer.connection, 'connectionstatechange', () => {
			// 연결이 끊기면 보는 기기가 다시 요청할 때까지 정리
			if (peer.connection.connectionState === 'failed' && peers.get(viewerId) === peer) {
				closePeer(viewerId);
			}
		});

		media.getTracks().forEach((track) => {
			peer.connection.addTrack(track, media);
		});

		const description = descriptionSchema.parse(await peer.connection.createOffer({}));

		await peer.connection.setLocalDescription(description);

		signaling.send({ type: 'offer', viewerId, description });
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
				viewerIds = viewerIds.filter((id) => id !== message.viewerId);

				closePeer(message.viewerId);
			} else if (message.type === 'answer') {
				void peers.get(message.viewerId)?.setRemote(message.description).catch(onError);
			} else if (message.type === 'candidate' && message.from === 'viewer') {
				peers.get(message.viewerId)?.addCandidate(message.candidate);
			} else if (message.type === 'camera-set') {
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

			sendState();

			if (media) {
				viewerIds.forEach((viewerId) => void offer(viewerId, media).catch(onError));
			}
		},
		/** 카메라 권한이 없어 켜지 못했음을 보는 기기에 알리는 함수 */
		reportPermissionDenied: () => {
			permissionDenied = true;

			sendState();
		},
		close: () => {
			[...peers.keys()].forEach(closePeer);

			signaling.close();
		},
	};
};

export type StationPetcam = ReturnType<typeof createStationPetcam>;

/** 다른 기기에서 진행 중인 학습의 카메라 영상을 받는 연결을 만드는 함수 */
export const createViewerPetcam = ({ sessionId, onState, onStream, onError }: ViewerPetcamOptions) => {
	const viewerId = randomUUID();

	let peer: Peer | null = null;

	/** 받고 있던 영상 연결 닫기 함수 */
	const closePeer = () => {
		peer?.close();
		peer = null;

		onStream(null);
	};

	/** 학습 중인 기기가 제안한 영상 연결을 수락하는 함수 */
	const answer = async (description: Description) => {
		closePeer();

		const created = createPeer(
			(candidate) => signaling.send({ type: 'candidate', viewerId, from: 'viewer', candidate }),
			onError,
		);

		peer = created;

		listen(created.connection, 'track', (event) => {
			const [media] = event.streams;

			if (media && peer === created) {
				onStream(media);
			}
		});
		listen(created.connection, 'connectionstatechange', () => {
			// 연결이 끊기면 다시 요청
			if (created.connection.connectionState === 'failed' && peer === created) {
				closePeer();

				signaling.send({ type: 'viewer-join', viewerId });
			}
		});

		await created.setRemote(description);

		const localDescription = descriptionSchema.parse(await created.connection.createAnswer());

		await created.connection.setLocalDescription(localDescription);

		signaling.send({ type: 'answer', viewerId, description: localDescription });
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
				void answer(message.description).catch(onError);
			} else if (message.type === 'candidate' && message.from === 'station' && message.viewerId === viewerId) {
				peer?.addCandidate(message.candidate);
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

			peer?.close();
			peer = null;

			signaling.close();
		},
	};
};
