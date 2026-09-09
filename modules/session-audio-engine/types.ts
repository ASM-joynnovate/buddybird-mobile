export type SessionState =
  "idle" | "starting" | "running" | "paused" | "interrupted" | "completed" | "failed" | "stopping"

export type SessionPhase = "learning" | "rest" | "stress-care"

export type FailureCode =
  | "permission-denied"
  | "audio-source-unavailable"
  | "audio-route-unavailable"
  | "storage-unavailable"
  | "service-start-not-allowed"
  | "audio-engine-failed"

export interface SessionFailure {
  code: FailureCode
  message: string
  recoverable: boolean
}

export interface VADConfig {
  dbFloor: number
  dbCeil: number
  threshold: number
  sustainMs: number
  releaseMs: number
  preRollMs: number
  echoTailGuardMs: number
  maxSegmentMs: number
}

export const defaultVAD: VADConfig = {
  dbFloor: -60,
  dbCeil: -10,
  threshold: 0.35,
  sustainMs: 300,
  releaseMs: 500,
  preRollMs: 500,
  echoTailGuardMs: 200,
  maxSegmentMs: 10000,
}

export interface RecoveryIdentity {
  wordId: string
  word: string
  sourceType: "preset" | "recording"
  startedAt: string
  libraryEntryId?: string
  wordSnapshot?: Record<string, unknown>
}

export interface SessionInput {
  sessionId: string
  targetAudioUri: string
  captureDirectoryUri: string
  totalDurationMs: number
  learningDurationMs: number
  restDurationMs: number
  stressCareDurationMs: number
  stressCareAudioUris: string[]
  maxPendingCaptureBytes: number
  vad: VADConfig
  recovery: RecoveryIdentity
  notification: {
    learningSubtitle: string
    restSubtitle: string
    stressCareSubtitle: string
    pausedSubtitle: string
  }
}

export interface SessionSnapshot {
  sessionId: string | null
  state: SessionState
  elapsedRunningMs: number
  cycle: number
  phase: SessionPhase
  phaseElapsedMs: number
  isTargetPlaying: boolean
  savedAt: string
  lastPlaybackStartDelayMs: number | null
}

export interface CapturedSegment {
  segmentId: string
  sessionId: string
  uri: string
  fileName: string
  phase: "learning" | "rest"
  cycle: number
  capturedAt: string
  durationMs: number
  speechStartMs: number
  speechEndMs: number
}

export interface PendingRecovery {
  sessionId: string
  recovery: RecoveryIdentity
  totalDurationMs: number
  learningDurationMs: number
  restDurationMs: number
  stressCareDurationMs: number
  targetAudioUri: string
  snapshot: SessionSnapshot
  reason: "duration-reached" | "user-stopped" | "failure" | "task-removed" | "interruption" | null
}
