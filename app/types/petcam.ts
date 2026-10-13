import { z } from 'zod';

import type { MediaStream, RTCIceCandidate, RTCPeerConnection, RTCRtpSender } from 'react-native-webrtc';

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
	z.object({ type: z.literal('camera-set'), cameraOn: z.boolean() }),
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

export type PetcamDescription = z.infer<typeof petcamDescriptionSchema>;
export type PetcamCandidate = z.infer<typeof petcamCandidateSchema>;
export type PetcamMessage = z.infer<typeof petcamMessageSchema>;

export interface PetcamState {
	cameraOn: boolean;
	permissionDenied: boolean;
}

export interface PetcamIceServer {
	urls: string | string[];
	username?: string;
	credential?: string;
}

export type PetcamTurnCredentialIssuer = () => Promise<{ ice_servers: PetcamIceServer[] }>;

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

export interface PetcamSenderPeer {
	peer: PetcamPeer;
	offerId: string;
	audioSender: RTCRtpSender;
	connectTimer: ReturnType<typeof setTimeout>;
}

export interface PetcamSenderOptions {
	sessionId: string;
	issueTurnCredential: PetcamTurnCredentialIssuer;
	onCameraRequest: (cameraOn: boolean) => void;
	onViewerConnectedChange: (viewerConnected: boolean) => void;
	onError: (error: unknown) => void;
}

export interface PetcamReceiverOptions {
	sessionId: string;
	issueTurnCredential: PetcamTurnCredentialIssuer;
	onState: (state: PetcamState) => void;
	onStream: (stream: MediaStream | null) => void;
	onError: (error: unknown) => void;
}
