import { type NativeModule, requireNativeModule } from "expo-modules-core"

import type  {
	CapturedSegment,
	CaptureChanges,
	TargetPlayback,
	PendingRecovery,
	SessionFailure,
	SessionInput,
	SessionSnapshot,
} from "@modules/session-audio-engine/types"

export * from "@modules/session-audio-engine/types"
type Events = {
	onTargetPlayback: (playback: TargetPlayback) => void
	onPlaybackMetering: (measurement: { decibels: number }) => void
	onStateChanged: (snapshot: SessionSnapshot) => void
	onProgress: (snapshot: SessionSnapshot) => void
	onSegmentCaptured: (segment: CapturedSegment) => void
	onFailure: (failure: SessionFailure) => void
}

export declare class SessionAudioEngineModule extends NativeModule<Events> {
	start(input: SessionInput): Promise<SessionSnapshot>
	pause(): Promise<SessionSnapshot>
	resume(): Promise<SessionSnapshot>
	stop(): Promise<SessionSnapshot>
	getSnapshot(): Promise<SessionSnapshot>
	getPendingRecovery(): Promise<PendingRecovery | null>
	clearPendingRecovery(sessionId: string): Promise<void>
	getCaptureChanges(): Promise<CaptureChanges>
	ackCaptureChanges(segmentIds: string[], evictedFileNames: string[]): Promise<void>
}

export default requireNativeModule<SessionAudioEngineModule>("SessionAudioEngine")
