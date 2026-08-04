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

// 잠금화면 미디어 알림(Android MediaStyle / iOS Now Playing)에 쓸 문구.
// 네이티브 문자열 리소스를 쓰면 OS 로케일을 따라가 인앱 언어 토글이 반영되지 않으므로
// (docs/I18N.md) JS 가 t() 로 해석한 문구를 넘긴다. 제목은 recovery.word 를 그대로 쓴다.
// 부제목은 네이티브가 %{cycle}·%{total} 을 현재 값으로 치환한다.
export interface SessionNotificationCopy {
  learningSubtitle: string;
  restSubtitle: string;
  pausedSubtitle: string;
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
  notification: SessionNotificationCopy;
}

export interface SessionEngineSnapshot {
  sessionId: string;
  state: SessionEngineState;
  elapsedRunningMs: number;
  cycle: number;
  phase: 'learning' | 'rest';
  phaseElapsedMs: number;
  isTargetPlaying: boolean;
  /**
   * 직전 목표 음원 재생의 의도(스케줄)→시작 지연 ms (BB-285 audio_delay).
   * Android는 실제 재생 시작(onIsPlayingChanged) 관측, iOS는 play() 디스패치까지의 근사.
   * 스케줄마다 리셋되므로 미확정 구간·과거 세션 스냅샷에는 없다 — Android는 null, iOS는 키 생략.
   */
  lastPlaybackStartDelayMs?: number | null;
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
