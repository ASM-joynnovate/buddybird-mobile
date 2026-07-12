import type { SessionAudioEngine } from './session-audio-engine.types';

const unsupported = (): never => {
  throw new Error('Background training audio is only available on iOS and Android.');
};

export const sessionAudioEngine: SessionAudioEngine = {
  start: async () => unsupported(),
  pause: async () => unsupported(),
  resume: async () => unsupported(),
  stop: async () => unsupported(),
  getSnapshot: async () => null,
  getPendingRecovery: async () => null,
  clearPendingRecovery: async () => undefined,
  getUnstoredSegments: async () => [],
  markSegmentsStored: async () => undefined,
  onStateChanged: () => () => undefined,
  onProgress: () => () => undefined,
  onSegmentCaptured: () => () => undefined,
  onFailure: () => () => undefined,
};
