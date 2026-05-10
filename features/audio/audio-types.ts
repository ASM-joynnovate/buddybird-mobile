export type AudioSourceChoice = 'preset' | 'recording';
export type RecordingLifecycle = 'idle' | 'requesting-permission' | 'recording' | 'recorded' | 'error';
export type AudioPreviewState = 'idle' | 'ready' | 'playing' | 'disabled' | 'error';

export interface PitchTransformMetadata {
  profileId: string;
  playbackRate: number;
  preservesPitch: boolean;
  transformedUri?: string;
  appliedAt: string;
}

export interface StableRecordingFile {
  uri: string;
  fileName: string;
}
