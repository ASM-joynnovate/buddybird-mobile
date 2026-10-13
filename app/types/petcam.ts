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

export const petcamSentVideoStatsSchema = z.object({
	type: z.literal('outbound-rtp'),
	kind: z.literal('video'),
	framesPerSecond: z.number(),
	frameWidth: z.number(),
	frameHeight: z.number(),
	bytesSent: z.number(),
	qualityLimitationReason: z.string().optional(),
});

export const petcamReceivedVideoStatsSchema = z.object({
	type: z.literal('inbound-rtp'),
	kind: z.literal('video'),
	framesPerSecond: z.number(),
	frameWidth: z.number(),
	frameHeight: z.number(),
});

export type PetcamDescription = z.infer<typeof petcamDescriptionSchema>;
export type PetcamCandidate = z.infer<typeof petcamCandidateSchema>;
export type PetcamMessage = z.infer<typeof petcamMessageSchema>;

export interface PetcamState {
	cameraOn: boolean;
	permissionDenied: boolean;
}

export interface PetcamVideoSettings {
	width: number;
	height: number;
	frameRate: number;
}

export interface PetcamVideoStats {
	frameRate: number;
	frameWidth: number;
	frameHeight: number;
	bitrate: number | null;
	qualityLimitation: string | null;
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
	onVideoStats: (stats: PetcamVideoStats) => void;
	onError: (error: unknown) => void;
}

export interface PetcamReceiverOptions {
	sessionId: string;
	issueTurnCredential: PetcamTurnCredentialIssuer;
	onState: (state: PetcamState) => void;
	onStream: (stream: MediaStream | null) => void;
	onVideoStats: (stats: PetcamVideoStats) => void;
	onError: (error: unknown) => void;
}
