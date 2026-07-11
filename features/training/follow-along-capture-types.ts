// 따라하기 갭·휴식 구간에서 감지·녹음된 캡처(local-first). 백엔드 연결 전까지 로컬 보관하며,
// 연결 시 follow-along-upload 의 seam 으로 그대로 전송한다. UI 노출은 하지 않는다.

export interface CaptureSegment {
  startMs: number;
  endMs: number;
}

// 캡처가 발생한 세션 phase. learning = 따라하기 무음 갭, rest = 휴식 구간 발화.
export type CapturePhase = 'learning' | 'rest';

export interface FollowAlongCapture {
  id: string;
  sessionId: string;
  wordId: string;
  cycle: number;
  phase: CapturePhase;
  capturedAt: string; // ISO
  // StableRecordingFile.uri — 저장 시 seam 이 recording:// 로 정규화, load 시 절대경로로 hydrate.
  uri: string;
  fileName: string;
  segments: CaptureSegment[];
  // 오디오 파일 크기(bytes) — 로컬 보관 상한 계산에 사용.
  sizeBytes: number;
  uploaded: boolean;
}

export interface FollowAlongCaptureStore {
  capturesById: Record<string, FollowAlongCapture>;
}
