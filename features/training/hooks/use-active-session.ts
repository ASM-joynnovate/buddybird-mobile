import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useAnalytics } from '@/features/analytics/analytics-context';
import { reportError } from '@/features/analytics/error-reporter';
import {
  sessionAudioEngine,
  type CapturedSegment,
  type SessionEngineSnapshot,
  type SessionRecoveryRecord,
} from '@/modules/session-audio-engine';

import { storeNativeCapturedSegments } from '../native-session-capture-storage';
import type { SessionStatus } from '../session-config';
import {
  completedCyclesAtPosition,
  deriveSessionCycles,
  elapsedLearningSeconds,
  STREAK_QUALIFYING_SECONDS,
} from '../session-cycle-model';
import { prepareSessionAudioUri, prepareSessionCaptureDirectoryUri } from '../session-audio-assets';
import { MAX_PENDING_CAPTURE_BYTES, SESSION_VAD_CONFIG } from '../session-audio-engine-config';
import { useTrainingData } from '../training-context';
import { createTrainingSession } from '../training-model';
import type { CreateTrainingSessionInput, TrainingSessionSettings } from '../training-types';
import { useSessionKeepAwake } from './use-session-keep-awake';

interface UseActiveSessionInput {
  wordId: string;
  settings: TrainingSessionSettings;
  audioUri?: string | number;
  word: string;
}

export interface UseActiveSessionResult {
  status: SessionStatus;
  phase: 'learning' | 'rest';
  cycle: number;
  totalCycles: number;
  phaseRemaining: number;
  phaseProgress: number;
  progress: number;
  audioOn: boolean;
  isLearning: boolean;
  currentWord: string;
  togglePause: () => void;
  stop: () => void;
  dismissCompletion: () => void;
  learnSecs: number;
  sessionMins: number;
  totalLearningSeconds: number;
}

export function useActiveSession({ wordId, settings, audioUri, word }: UseActiveSessionInput): UseActiveSessionResult {
  const { saveCompletedSession, pendingSession } = useTrainingData();
  const { track } = useAnalytics();
  const sessionId = pendingSession?.sessionId ?? '';
  const learnSecs = settings.learningDurationSeconds;
  const restSecs = settings.restDurationSeconds;
  const { totalCycles, sessionMins, totalSessionSeconds } = deriveSessionCycles({
    totalSeconds: settings.totalDurationSeconds,
    learnSecs,
    restSecs,
  });
  const [snapshot, setSnapshot] = useState<SessionEngineSnapshot>(() => initialSnapshot(sessionId));
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  const completionHandledRef = useRef(false);
  const failureHandledRef = useRef(false);
  const finalizePromiseRef = useRef<Promise<void> | null>(null);

  const acceptSnapshot = useCallback((next: SessionEngineSnapshot): void => {
    if (next.sessionId === sessionId) setSnapshot(next);
  }, [sessionId]);

  const storeSegment = useCallback(async (segment: CapturedSegment): Promise<void> => {
    if (segment.sessionId !== sessionId) return;
    try {
      await storeNativeCapturedSegments([segment], wordId);
    } catch (error: unknown) {
      reportError(error, { scope: 'training.sessionAudio.storeSegment' });
    }
  }, [sessionId, wordId]);

  const syncUnstoredSegments = useCallback(async (): Promise<void> => {
    try {
      const segments = await sessionAudioEngine.getUnstoredSegments();
      await storeNativeCapturedSegments(segments.filter((segment) => segment.sessionId === sessionId), wordId);
    } catch (error: unknown) {
      reportError(error, { scope: 'training.sessionAudio.syncSegments' });
    }
  }, [sessionId, wordId]);

  useEffect(() => {
    let cancelled = false;
    const unsubscribers = [
      sessionAudioEngine.onStateChanged(acceptSnapshot),
      sessionAudioEngine.onProgress(acceptSnapshot),
      sessionAudioEngine.onSegmentCaptured((segment) => { void storeSegment(segment); }),
      sessionAudioEngine.onFailure((failure) => {
        reportError(new Error(`${failure.code}: ${failure.message}`), { scope: 'training.sessionAudio.native' });
      }),
    ];

    async function startNativeSession(): Promise<void> {
      try {
        const existing = await sessionAudioEngine.getSnapshot();
        if (existing?.sessionId === sessionId) {
          if (!cancelled) acceptSnapshot(existing);
          await syncUnstoredSegments();
          return;
        }
        if (!sessionId || audioUri === undefined) throw new Error('세션 음원 또는 세션 ID가 없습니다.');
        const targetAudioUri = await prepareSessionAudioUri(audioUri);
        const next = await sessionAudioEngine.start({
          sessionId,
          targetAudioUri,
          captureDirectoryUri: prepareSessionCaptureDirectoryUri(),
          totalDurationMs: settings.totalDurationSeconds * 1000,
          learningDurationMs: learnSecs * 1000,
          restDurationMs: restSecs * 1000,
          maxPendingCaptureBytes: MAX_PENDING_CAPTURE_BYTES,
          vad: SESSION_VAD_CONFIG,
          recovery: {
            wordId,
            word,
            sourceType: settings.sourceType,
            libraryEntryId: settings.libraryEntryId,
            startedAt: new Date().toISOString(),
          },
        });
        if (!cancelled) acceptSnapshot(next);
        await syncUnstoredSegments();
      } catch (error: unknown) {
        reportError(error, { scope: 'training.sessionAudio.start', screen_name: 'session_active' });
        if (!cancelled) setSnapshot((current) => ({ ...current, state: 'failed', savedAt: new Date().toISOString() }));
      }
    }

    void startNativeSession();
    return () => {
      cancelled = true;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [
    acceptSnapshot,
    audioUri,
    learnSecs,
    restSecs,
    sessionId,
    settings.libraryEntryId,
    settings.sourceType,
    settings.totalDurationSeconds,
    storeSegment,
    syncUnstoredSegments,
    word,
    wordId,
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void sessionAudioEngine.getSnapshot().then((next) => {
          if (next) acceptSnapshot(next);
        }).catch((error: unknown) => reportError(error, { scope: 'training.sessionAudio.getSnapshot' }));
        void syncUnstoredSegments();
        return;
      }
      const currentSnapshot = snapshotRef.current;
      if (nextState !== 'background' || currentSnapshot.state !== 'running' || !sessionId) return;
      track({
        name: 'training_session_backgrounded',
        params: {
          session_id: sessionId,
          phase: currentSnapshot.phase,
          elapsed_seconds: Math.floor(currentSnapshot.elapsedRunningMs / 1000),
        },
      });
    });
    return () => subscription.remove();
  }, [acceptSnapshot, sessionId, syncUnstoredSegments, track]);

  const persistRecovery = useCallback(async (record: SessionRecoveryRecord): Promise<void> => {
    const elapsedSeconds = Math.floor(record.snapshot.elapsedRunningMs / 1000);
    const shouldPersist = record.reason === 'duration-reached' || elapsedSeconds >= STREAK_QUALIFYING_SECONDS;
    if (!shouldPersist) {
      await sessionAudioEngine.clearPendingRecovery(record.snapshot.sessionId);
      return;
    }

    const endedAt = new Date().toISOString();
    const phaseElapsedSeconds = Math.floor(record.snapshot.phaseElapsedMs / 1000);
    const totalLearningSeconds = elapsedLearningSeconds(
      record.snapshot.cycle,
      record.snapshot.phase,
      phaseElapsedSeconds,
      record.learningDurationMs / 1000,
    );
    const session = {
      ...createTrainingSession(
      {
        wordId: record.recovery.wordId,
        sourceType: record.recovery.sourceType,
        totalDurationSeconds: record.totalDurationMs / 1000,
        learningDurationSeconds: record.learningDurationMs / 1000,
        restDurationSeconds: record.restDurationMs / 1000,
        completedCycles: completedCyclesAtPosition(
          record.snapshot.cycle,
          record.snapshot.phase,
          phaseElapsedSeconds,
          record.restDurationMs / 1000,
        ),
        totalLearningSeconds,
        startedAt: record.recovery.startedAt,
        endedAt,
        libraryEntryId: record.recovery.libraryEntryId,
      } satisfies CreateTrainingSessionInput,
      endedAt,
      ),
      id: record.snapshot.sessionId,
    };
    await saveCompletedSession(session);
    await sessionAudioEngine.clearPendingRecovery(record.snapshot.sessionId);
  }, [saveCompletedSession]);

  const finalizeSession = useCallback((): Promise<void> => {
    if (finalizePromiseRef.current) return finalizePromiseRef.current;
    const operation = sessionAudioEngine.stop()
      .then(persistRecovery)
      .catch((error: unknown) => {
        reportError(error, { scope: 'training.sessionAudio.stop', screen_name: 'session_active' });
      });
    finalizePromiseRef.current = operation;
    return operation;
  }, [persistRecovery]);

  useEffect(() => {
    if (snapshot.state !== 'completed' || completionHandledRef.current) return;
    completionHandledRef.current = true;
    void finalizeSession();
  }, [finalizeSession, snapshot.state]);

  // 실패한 세션도 stop()으로 네이티브 configuration을 비워야 다음 start()가 거부되지 않는다.
  // 로컬에서만 failed로 표시된 경우(start 자체가 실패)는 네이티브에 세션이 없을 수 있으므로,
  // 실제 네이티브 세션이 우리 것이거나 종단 상태로 잔존할 때만 정리한다.
  useEffect(() => {
    if (snapshot.state !== 'failed' || failureHandledRef.current) return;
    failureHandledRef.current = true;
    void sessionAudioEngine.getSnapshot()
      .then((native) => {
        if (!native) return;
        if (native.sessionId !== sessionId && native.state !== 'failed' && native.state !== 'completed') return;
        return finalizeSession();
      })
      .catch((error: unknown) => {
        reportError(error, { scope: 'training.sessionAudio.finalizeFailed', screen_name: 'session_active' });
      });
  }, [finalizeSession, sessionId, snapshot.state]);

  useSessionKeepAwake(snapshot.state === 'running');

  function togglePause(): void {
    const command = snapshot.state === 'running' ? sessionAudioEngine.pause() : sessionAudioEngine.resume();
    void command.then(acceptSnapshot).catch((error: unknown) => {
      reportError(error, { scope: 'training.sessionAudio.togglePause', screen_name: 'session_active' });
    });
  }

  function stop(): void {
    void finalizeSession();
  }

  function dismissCompletion(): void {
    setSnapshot((current) => ({ ...current, state: 'idle' }));
  }

  const phaseElapsed = snapshot.phaseElapsedMs / 1000;
  const phaseDuration = snapshot.phase === 'learning' ? learnSecs : restSecs;
  const elapsedSeconds = snapshot.elapsedRunningMs / 1000;
  const creditedLearningSeconds = elapsedLearningSeconds(snapshot.cycle, snapshot.phase, phaseElapsed, learnSecs);

  return {
    status: snapshot.state,
    phase: snapshot.phase,
    cycle: Math.min(snapshot.cycle, totalCycles),
    totalCycles,
    phaseRemaining: Math.max(0, Math.ceil(phaseDuration - phaseElapsed)),
    phaseProgress: Math.min(1, phaseElapsed / Math.max(1, phaseDuration)),
    progress: Math.min(1, elapsedSeconds / totalSessionSeconds),
    audioOn: snapshot.state === 'running' && snapshot.isTargetPlaying,
    isLearning: snapshot.phase === 'learning',
    currentWord: word,
    togglePause,
    stop,
    dismissCompletion,
    learnSecs,
    sessionMins,
    totalLearningSeconds: creditedLearningSeconds,
  };
}

function initialSnapshot(sessionId: string): SessionEngineSnapshot {
  return {
    sessionId,
    state: 'starting',
    elapsedRunningMs: 0,
    cycle: 1,
    phase: 'learning',
    phaseElapsedMs: 0,
    isTargetPlaying: false,
    savedAt: new Date().toISOString(),
  };
}
