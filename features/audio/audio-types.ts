export type AudioSourceChoice = 'preset' | 'recording';
export type RecordingLifecycle = 'idle' | 'requesting-permission' | 'recording' | 'recorded' | 'error';
export type AudioPreviewState = 'idle' | 'ready' | 'playing' | 'disabled' | 'error';

export interface StableRecordingFile {
  uri: string;
  fileName: string;
}

// VAD 가 녹음 파일 안에서 찾아낸 발화 구간(파일 t=0 기준 ms).
export interface DetectedSegment {
  startMs: number;
  endMs: number;
}
