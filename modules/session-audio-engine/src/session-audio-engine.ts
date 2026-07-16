import { NativeModule, requireNativeModule } from 'expo';

import type {
  CapturedSegment,
  SessionAudioEngine,
  SessionAudioEngineEvents,
  SessionAudioEngineStartInput,
  SessionEngineFailure,
  SessionEngineSnapshot,
  SessionRecoveryRecord,
} from './session-audio-engine.types';

type EventName = keyof SessionAudioEngineEvents;

declare class SessionAudioEngineNativeModule extends NativeModule<SessionAudioEngineEvents> {
  start(input: SessionAudioEngineStartInput): Promise<SessionEngineSnapshot>;
  pause(): Promise<SessionEngineSnapshot>;
  resume(): Promise<SessionEngineSnapshot>;
  stop(): Promise<SessionRecoveryRecord>;
  getSnapshot(): Promise<SessionEngineSnapshot | null>;
  getPendingRecovery(): Promise<SessionRecoveryRecord | null>;
  clearPendingRecovery(sessionId: string): Promise<void>;
  getUnstoredSegments(): Promise<CapturedSegment[]>;
  markSegmentsStored(segmentIds: string[]): Promise<void>;
}

const nativeModule = requireNativeModule<SessionAudioEngineNativeModule>('SessionAudioEngine');

function subscribe<T extends EventName>(eventName: T, callback: SessionAudioEngineEvents[T]): () => void {
  const subscription = nativeModule.addListener(eventName, callback);
  return () => subscription.remove();
}

export const sessionAudioEngine: SessionAudioEngine = {
  start: (input) => nativeModule.start(input),
  pause: () => nativeModule.pause(),
  resume: () => nativeModule.resume(),
  stop: () => nativeModule.stop(),
  getSnapshot: () => nativeModule.getSnapshot(),
  getPendingRecovery: () => nativeModule.getPendingRecovery(),
  clearPendingRecovery: (sessionId) => nativeModule.clearPendingRecovery(sessionId),
  getUnstoredSegments: () => nativeModule.getUnstoredSegments(),
  markSegmentsStored: (segmentIds) => nativeModule.markSegmentsStored(segmentIds),
  onStateChanged: (callback) => subscribe('onStateChanged', callback),
  onProgress: (callback) => subscribe('onProgress', callback),
  onSegmentCaptured: (callback) => subscribe('onSegmentCaptured', callback),
  onFailure: (callback: (failure: SessionEngineFailure) => void) => subscribe('onFailure', callback),
};
