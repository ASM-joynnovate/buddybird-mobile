export type SessionEngineState =
  | 'idle'
  | 'starting'
  | 'running'
  | 'paused'
  | 'interrupted'
  | 'completed'
  | 'failed'
  | 'stopping';

export interface SessionVadConfig {
  dbFloor: number;
  dbCeil: number;
  threshold: number;
  sustainMs: number;
  releaseMs: number;
  preRollMs: number;
  echoTailGuardMs: number;
  maxSegmentMs: number;
}

export interface SessionRecoveryInfo {
  wordId: string;
  word: string;
  sourceType: 'preset' | 'recording';
  libraryEntryId?: string;
  startedAt: string;
}

export interface SessionAudioEngineStartInput {
  sessionId: string;
  targetAudioUri: string;
  captureDirectoryUri: string;
  totalDurationMs: number;
  learningDurationMs: number;
  restDurationMs: number;
  maxPendingCaptureBytes: number;
  vad: SessionVadConfig;
  recovery: SessionRecoveryInfo;
}

export interface SessionEngineSnapshot {
  sessionId: string;
  state: SessionEngineState;
  elapsedRunningMs: number;
  cycle: number;
  phase: 'learning' | 'rest';
  phaseElapsedMs: number;
  savedAt: string;
}

export type SessionRecoveryReason = 'duration-reached' | 'user-stopped' | 'interruption' | 'failure' | null;

export interface SessionRecoveryRecord {
  snapshot: SessionEngineSnapshot;
  recovery: SessionRecoveryInfo;
  totalDurationMs: number;
  learningDurationMs: number;
  restDurationMs: number;
  reason: SessionRecoveryReason;
}

export interface CapturedSegment {
  segmentId: string;
  sessionId: string;
  uri: string;
  fileName: string;
  phase: 'learning' | 'rest';
  cycle: number;
  capturedAt: string;
  durationMs: number;
  speechStartMs: number;
  speechEndMs: number;
}

export type SessionEngineFailureCode =
  | 'permission-denied'
  | 'audio-source-unavailable'
  | 'audio-route-unavailable'
  | 'storage-unavailable'
  | 'service-start-not-allowed'
  | 'audio-engine-failed';

export interface SessionEngineFailure {
  code: SessionEngineFailureCode;
  message: string;
  recoverable: boolean;
}

export type SessionAudioEngineEvents = {
  onStateChanged: (snapshot: SessionEngineSnapshot) => void;
  onProgress: (snapshot: SessionEngineSnapshot) => void;
  onSegmentCaptured: (segment: CapturedSegment) => void;
  onFailure: (failure: SessionEngineFailure) => void;
};

export interface SessionAudioEngine {
  start(input: SessionAudioEngineStartInput): Promise<SessionEngineSnapshot>;
  pause(): Promise<SessionEngineSnapshot>;
  resume(): Promise<SessionEngineSnapshot>;
  stop(): Promise<SessionRecoveryRecord>;
  getSnapshot(): Promise<SessionEngineSnapshot | null>;
  getPendingRecovery(): Promise<SessionRecoveryRecord | null>;
  clearPendingRecovery(sessionId: string): Promise<void>;
  getUnstoredSegments(): Promise<CapturedSegment[]>;
  markSegmentsStored(segmentIds: string[]): Promise<void>;
  onStateChanged(callback: SessionAudioEngineEvents['onStateChanged']): () => void;
  onProgress(callback: SessionAudioEngineEvents['onProgress']): () => void;
  onSegmentCaptured(callback: SessionAudioEngineEvents['onSegmentCaptured']): () => void;
  onFailure(callback: SessionAudioEngineEvents['onFailure']): () => void;
}
