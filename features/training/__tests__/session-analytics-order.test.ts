import { createElement, type ReactElement } from 'react';

import { useAnalytics } from '@/features/analytics/analytics-context';
import type { AnalyticsEvent } from '@/features/analytics/events';
import { createFanoutAnalyticsClient } from '@/features/analytics/client';
import { NoopProvider } from '@/features/analytics/providers/noop-provider';
import { readWordLifetimeMetrics } from '@/features/analytics/word-metrics-storage';
import { sessionAudioEngine, type SessionEngineSnapshot } from '@/modules/session-audio-engine';
import { useTrainingData, type PendingSession } from '../training-context';
import { useActiveSession } from '../hooks/use-active-session';
import { useSessionAnalytics } from '../hooks/use-session-analytics';

jest.mock('react-native', () => ({ AppState: { addEventListener: () => ({ remove: jest.fn() }) } }));
jest.mock('@/features/shared/ids', () => ({ createSessionId: () => 's2' }));
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('@/features/analytics/analytics-context', () => ({ useAnalytics: jest.fn() }));
jest.mock('@/features/analytics/word-metrics-storage', () => ({ readWordLifetimeMetrics: jest.fn() }));
jest.mock('@/features/analytics/error-reporter', () => ({ reportError: jest.fn() }));
jest.mock('@/features/analytics/hooks/use-session-replay-pause', () => ({ useSessionReplayPause: jest.fn() }));
jest.mock('@/features/i18n/i18n-context', () => {
  const t = (key: string) => key;
  return { useI18n: () => ({ t }) };
});
jest.mock('../training-context', () => ({ useTrainingData: jest.fn() }));
jest.mock('../follow-along-upload', () => ({ requestCaptureFlush: jest.fn() }));
jest.mock('../native-session-capture-storage', () => ({ storeNativeCapturedSegments: jest.fn(async () => {}) }));
jest.mock('../session-audio-assets', () => ({ prepareSessionAudioUri: async () => 'file://audio', prepareSessionCaptureDirectoryUri: () => 'file://captures' }));
jest.mock('../stress-care-tracks', () => ({ STRESS_CARE_TRACK_MODULES: [] }));
jest.mock('../hooks/use-session-keep-awake', () => ({ useSessionKeepAwake: jest.fn() }));
jest.mock('../hooks/use-session-perf', () => ({ useSessionPerf: jest.fn() }));
jest.mock('@/modules/session-audio-engine', () => ({ sessionAudioEngine: {
  onStateChanged: jest.fn(), onProgress: jest.fn(), onSegmentCaptured: jest.fn(), onFailure: jest.fn(),
  getSnapshot: jest.fn(), getUnstoredSegments: jest.fn(async () => []), clearPendingRecovery: jest.fn(async () => {}),
  start: jest.fn(), stop: jest.fn(),
} }));

const { act, create } = jest.requireActual<{
  act: (callback: () => void | Promise<void>) => Promise<void>;
  create: (element: ReactElement) => { unmount: () => void };
}>('react-test-renderer');
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}
const pendingSession: PendingSession = {
  sessionId: 's1', wordId: 'w1', word: 'Hello', audioUri: 'file://audio',
  settings: { wordId: 'w1', totalDurationSeconds: 120, learningDurationSeconds: 10, restDurationSeconds: 10, stressCareDurationSeconds: 0, sourceType: 'recording' },
};
const running: SessionEngineSnapshot = {
  sessionId: 's1', state: 'running', elapsedRunningMs: 0, cycle: 1, phase: 'learning',
  phaseElapsedMs: 0, isTargetPlaying: false, savedAt: '2026-09-11T00:00:00.000Z',
};
let api: ReturnType<typeof useSessionAnalytics> & { session: ReturnType<typeof useActiveSession> };
const clearPendingSession = jest.fn();
function Probe() {
  const session = useActiveSession({ wordId: 'w1', word: 'Hello', audioUri: 'file://audio', settings: pendingSession.settings });
  api = { session, ...useSessionAnalytics({ pendingSession, session, clearPendingSession }) };
  return null;
}
let events: string[];
let onState: (snapshot: SessionEngineSnapshot) => void;
let renderer: ReturnType<typeof create> | undefined;
let client: ReturnType<typeof createFanoutAnalyticsClient>;
let flush: jest.Mock;

beforeEach(async () => {
  jest.clearAllMocks();
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  events = [];
  const provider = new NoopProvider();
  jest.spyOn(provider, 'logEvent').mockImplementation(async (name) => { events.push(name); });
  client = createFanoutAnalyticsClient({ providers: [provider] });
  client.initializeUserProperties({});
  await client.startCollection(true, () => null);
  flush = jest.fn(async () => []);
  jest.mocked(useAnalytics).mockReturnValue({ track: (event: AnalyticsEvent | Promise<AnalyticsEvent | null>) => { void client.logEvent(event); }, flushSessionWordMetrics: flush } as unknown as ReturnType<typeof useAnalytics>);
  jest.mocked(useTrainingData).mockReturnValue({ pendingSession, saveCompletedSession: jest.fn(async () => {}) } as unknown as ReturnType<typeof useTrainingData>);
  jest.mocked(readWordLifetimeMetrics).mockResolvedValue(null);
  jest.mocked(sessionAudioEngine.getSnapshot).mockResolvedValue(null);
  jest.mocked(sessionAudioEngine.start).mockResolvedValue(running);
  jest.mocked(sessionAudioEngine.stop).mockResolvedValue({ snapshot: running, reason: 'user-stopped', recovery: { wordId: 'w1', word: 'Hello', sourceType: 'recording', startedAt: running.savedAt }, totalDurationMs: 120000, learningDurationMs: 10000, restDurationMs: 10000 });
  jest.mocked(sessionAudioEngine.onStateChanged).mockImplementation((listener) => { onState = listener; return () => {}; });
  for (const subscribe of [sessionAudioEngine.onProgress, sessionAudioEngine.onSegmentCaptured, sessionAudioEngine.onFailure]) {
    jest.mocked(subscribe).mockReturnValue(() => {});
  }
});
afterEach(async () => {
  if (renderer) await act(async () => { renderer!.unmount(); });
  renderer = undefined;
});

it('keeps practice start before stop after delayed metrics and unmount', async () => {
  const metrics = deferred<null>();
  jest.mocked(readWordLifetimeMetrics).mockReturnValue(metrics.promise);
  await act(async () => { renderer = create(createElement(Probe)); });
  expect(api.session.status).toBe('running');
  await act(async () => { api.handleStop(); api.handleStop(); renderer!.unmount(); });
  renderer = undefined;
  expect(events).toEqual([]);
  await act(async () => { metrics.resolve(null); });
  expect(events).toEqual(['word_practice_started', 'training_session_abandoned']);
  expect(flush).toHaveBeenCalledTimes(1);
});

it('keeps start before completion when native state arrives before the start response', async () => {
  const response = deferred<SessionEngineSnapshot>();
  jest.mocked(sessionAudioEngine.start).mockReturnValue(response.promise);
  await act(async () => { renderer = create(createElement(Probe)); });
  await act(async () => { onState({ ...running, state: 'completed', elapsedRunningMs: 120000 }); });
  expect(events.slice(0, 3)).toEqual(['word_practice_started', 'word_practice_completed', 'training_session_completed']);
  expect(flush).toHaveBeenCalledTimes(1);
  await act(async () => { response.resolve({ ...running, state: 'completed', elapsedRunningMs: 120000 }); });
  expect(events.filter((name) => name === 'word_practice_started')).toHaveLength(1);
  expect(flush).toHaveBeenCalledTimes(1);
});

it('cancels a failed start reservation so subsequent events can proceed', async () => {
  jest.mocked(sessionAudioEngine.start).mockRejectedValue(new Error('cannot start'));
  await act(async () => { renderer = create(createElement(Probe)); });
  await client.logEvent({ name: 'app_foreground', params: {} });
  expect(events).toEqual(['app_foreground']);
});

it('does not count resuming an existing native session as a new start', async () => {
  jest.mocked(sessionAudioEngine.getSnapshot).mockResolvedValue(running);
  await act(async () => { renderer = create(createElement(Probe)); });
  await client.logEvent({ name: 'app_foreground', params: {} });
  expect(sessionAudioEngine.start).not.toHaveBeenCalled();
  expect(events).toEqual(['app_foreground']);
});
