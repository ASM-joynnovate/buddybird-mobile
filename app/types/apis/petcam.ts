import { z } from 'zod';

import type { MediaStream, RTCIceCandidate, RTCPeerConnection, RTCRtpSender } from 'react-native-webrtc';

// react-native-webrtc가 null인 접속 정보를 처리하지 못해, 값이 없는 서버는 주소만 남김
const iceServerSchema = z
	.object({ urls: z.array(z.string()), username: z.string().nullable(), credential: z.string().nullable() })
	.transform(({ urls, username, credential }) =>
		username !== null && credential !== null ? { urls, username, credential } : { urls },
	);

export const petcamTurnCredentialSchema = z.object({ ice_servers: z.array(iceServerSchema) });

export type PetcamTurnCredential = z.infer<typeof petcamTurnCredentialSchema>;

export const petcamDescriptionSchema = z.object({ type: z.enum(['offer', 'answer']), sdp: z.string() });

export const petcamCandidateSchema = z.object({
	candidate: z.string(),
	sdpMLineIndex: z.number().nullable(),
	sdpMid: z.string().nullable(),
});

export const petcamMessageSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('station-ready') }),
	z.object({ type: z.literal('state'), cameraOn: z.boolean(), permissionDenied: z.boolean() }),
	z.object({ type: z.literal('viewer-join'), viewerId: z.string() }),
	z.object({ type: z.literal('viewer-leave'), viewerId: z.string() }),
	z.object({ type: z.literal('camera-set'), on: z.boolean() }),
	z.object({
		type: z.literal('offer'),
		viewerId: z.string(),
		offerId: z.string(),
		description: petcamDescriptionSchema,
	}),
	z.object({
		type: z.literal('answer'),
		viewerId: z.string(),
		offerId: z.string(),
		description: petcamDescriptionSchema,
	}),
	z.object({
		type: z.literal('candidate'),
		viewerId: z.string(),
		offerId: z.string(),
		from: z.enum(['station', 'viewer']),
		candidate: petcamCandidateSchema,
	}),
]);

export type PetcamMessage = z.infer<typeof petcamMessageSchema>;
export type PetcamDescription = z.infer<typeof petcamDescriptionSchema>;
export type PetcamCandidate = z.infer<typeof petcamCandidateSchema>;

export interface PetcamState {
	cameraOn: boolean;
	permissionDenied: boolean;
}

export interface PetcamIceServer {
	urls: string | string[];
	username?: string;
	credential?: string;
}

// react-native-webrtc가 이벤트 타입 정의를 배포본에 넣지 않아, 사용하는 이벤트만 직접 정의
export interface PetcamPeerEvents {
	icecandidate: { candidate: RTCIceCandidate | null };
	track: { streams: MediaStream[] };
	connectionstatechange: object;
}

export interface PetcamPeerEventTarget {
	addEventListener: <Type extends keyof PetcamPeerEvents>(
		type: Type,
		listener: (event: PetcamPeerEvents[Type]) => void,
	) => void;
}

export interface PetcamSignaling {
	send: (message: PetcamMessage) => void;
	close: () => void;
}

export interface PetcamPeer {
	connection: RTCPeerConnection;
	setRemote: (description: PetcamDescription) => Promise<void>;
	addCandidate: (candidate: PetcamCandidate) => void;
	close: () => void;
}

export interface PetcamStationPeer {
	peer: PetcamPeer;
	offerId: string;
	audioSender: RTCRtpSender;
	connectTimer: ReturnType<typeof setTimeout>;
}

export interface StationPetcamOptions {
	sessionId: string;
	issueTurnCredential: () => Promise<PetcamTurnCredential>;
	onCameraRequest: (on: boolean) => void;
	onWatchedChange: (watched: boolean) => void;
	onError: (error: unknown) => void;
}

export interface ViewerPetcamOptions {
	sessionId: string;
	issueTurnCredential: () => Promise<PetcamTurnCredential>;
	onState: (state: PetcamState) => void;
	onStream: (stream: MediaStream | null) => void;
	onError: (error: unknown) => void;
}
