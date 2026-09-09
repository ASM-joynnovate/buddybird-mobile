import { NativeModule, requireNativeModule } from "expo-modules-core"

import type {
  CapturedSegment,
  PendingRecovery,
  SessionFailure,
  SessionInput,
  SessionSnapshot,
} from "@modules/session-audio-engine/types"

export * from "@modules/session-audio-engine/types"
type Events = {
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
  getUnstoredSegments(): Promise<CapturedSegment[]>
  markSegmentsStored(segmentIds: string[]): Promise<void>
}

export default requireNativeModule<SessionAudioEngineModule>("SessionAudioEngine")
