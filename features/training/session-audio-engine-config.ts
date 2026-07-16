import { VAD_RELEASE_SAMPLES, VAD_SUSTAIN_SAMPLES, VAD_THRESHOLD } from '@/features/audio/vad-detector';

import type { SessionVadConfig } from '@/modules/session-audio-engine';

export const MAX_PENDING_CAPTURE_BYTES = 500 * 1024 * 1024;

export const SESSION_VAD_CONFIG: SessionVadConfig = {
  dbFloor: -60,
  dbCeil: -10,
  threshold: VAD_THRESHOLD,
  sustainMs: VAD_SUSTAIN_SAMPLES * 100,
  releaseMs: VAD_RELEASE_SAMPLES * 100,
  preRollMs: 500,
  echoTailGuardMs: 200,
  maxSegmentMs: 30000,
};
