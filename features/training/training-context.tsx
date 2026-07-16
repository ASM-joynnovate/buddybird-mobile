import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';

import { reportError } from '@/features/analytics/error-reporter';
import { useI18n } from '@/features/i18n/i18n-context';
import { sessionAudioEngine } from '@/modules/session-audio-engine';

import { completedCyclesAtPosition, elapsedLearningSeconds, STREAK_QUALIFYING_SECONDS } from './session-cycle-model';
import { storeNativeCapturedSegments } from './native-session-capture-storage';
import {
  completeTrainingSession,
  createTrainingSession,
  markTrainingWordSuccess,
  saveLastSessionSettings as saveLastSessionSettingsInStore,
  upsertAudioRecording as upsertAudioRecordingInStore,
  upsertTrainingWord as upsertTrainingWordInStore,
} from './training-model';
import { loadTrainingStore, saveTrainingStore } from './training-storage';
import type { AudioRecording, TrainingSession, TrainingSessionSettings, TrainingStore, TrainingWord } from './training-types';

export interface PendingSession {
  sessionId: string;
  wordId: string;
  settings: TrainingSessionSettings;
  audioUri?: string | number;
  word: string;
}

// 이전 실행에서 중단된 세션을 다음 실행 때 부분 적립한 결과. 배너로 사용자에게 알린다.
export interface InterruptedSessionInfo {
  kind: 'active' | 'recovered';
  word: string;
  creditedLearningSeconds: number;
}

interface TrainingDataContextValue {
  store: TrainingStore | null;
  isHydrated: boolean;
  errorMessage: string | null;
  saveStore: (store: TrainingStore) => Promise<void>;
  upsertWord: (word: TrainingWord) => Promise<void>;
  upsertRecording: (recording: AudioRecording) => Promise<void>;
  saveCompletedSession: (session: TrainingSession) => Promise<void>;
  saveLastSessionSettings: (settings: TrainingSessionSettings) => Promise<void>;
  markWordSuccess: (wordId: string) => Promise<void>;
  pendingSession: PendingSession | null;
  setPendingSession: (next: PendingSession) => void;
  clearPendingSession: () => void;
  interruptedSession: InterruptedSessionInfo | null;
  dismissInterruptedSession: () => void;
}

const TrainingDataContext = createContext<TrainingDataContextValue | null>(null);

export function TrainingDataProvider({ children }: PropsWithChildren) {
  const [store, setStore] = useState<TrainingStore | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [pendingSession, setPendingSessionState] = useState<PendingSession | null>(null);
  const [interruptedSession, setInterruptedSession] = useState<InterruptedSessionInfo | null>(null);
  const storeRef = useRef<TrainingStore | null>(null);
  const writeQueueRef = useRef<Promise<void> | null>(null);
  const { t } = useI18n();

  const setPendingSession = useCallback((next: PendingSession): void => {
    setPendingSessionState(next);
  }, []);

  const clearPendingSession = useCallback((): void => {
    setPendingSessionState(null);
  }, []);

  const dismissInterruptedSession = useCallback((): void => {
    setInterruptedSession(null);
  }, []);

  const setTrainingStoreState = useCallback((nextStore: TrainingStore | null): void => {
    const clonedStore = nextStore ? cloneTrainingStore(nextStore) : null;

    storeRef.current = clonedStore;
    setStore(clonedStore);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function hydrateTrainingStore(): Promise<void> {
      try {
        const storedTrainingStore = await loadTrainingStore();
        const { store: recoveredStore, interrupted, pending } = await restoreOrRecoverSession(storedTrainingStore);

        if (isMounted) {
          setTrainingStoreState(recoveredStore);
          setInterruptedSession(interrupted);
          if (pending) setPendingSessionState(pending);
          setLoadFailed(false);
        }
      } catch (error: unknown) {
        if (isMounted) {
          setTrainingStoreState(null);
          // 원인별 상세는 seam이 이미 reportError로 남겼다 — 사용자에게는 일반 메시지만 노출.
          // 메시지는 렌더 시점에 t()로 해석해 인앱 언어 전환에도 즉시 따라간다.
          setLoadFailed(true);
        }
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    }

    hydrateTrainingStore();

    return () => {
      isMounted = false;
    };
  }, []);

  const enqueueWrite = useCallback((operation: () => Promise<void>): Promise<void> => {
    const nextWrite = (writeQueueRef.current ?? Promise.resolve()).then(operation, operation);
    // queue를 깨지 않기 위해 reject를 swallow한다. 호출자에게는 nextWrite로 reject가 전파됨.
    writeQueueRef.current = nextWrite.catch((error: unknown) => {
      reportError(error, { scope: 'training.writeQueue' });
    });

    return nextWrite;
  }, [setTrainingStoreState]);

  const saveStore = useCallback(
    async (nextStore: TrainingStore): Promise<void> =>
      enqueueWrite(async () => {
        await saveTrainingStore(nextStore);
        setTrainingStoreState(nextStore);
        setLoadFailed(false);
      }),
    [enqueueWrite, setTrainingStoreState]
  );

  const updateStore = useCallback(
    async (update: (currentStore: TrainingStore, nowIso: string) => TrainingStore): Promise<void> =>
      enqueueWrite(async () => {
        const currentStore = storeRef.current;

        if (!currentStore) {
          throw new Error('학습 데이터가 아직 준비되지 않았습니다.');
        }

        const nowIso = new Date().toISOString();
        const nextStore = update(currentStore, nowIso);
        await saveTrainingStore(nextStore);
        setTrainingStoreState(nextStore);
        setLoadFailed(false);
      }),
    [enqueueWrite, setTrainingStoreState]
  );

  const upsertWord = useCallback(
    async (word: TrainingWord): Promise<void> => {
      await updateStore((currentStore, nowIso) => upsertTrainingWordInStore(currentStore, word, nowIso));
    },
    [updateStore]
  );

  const upsertRecording = useCallback(
    async (recording: AudioRecording): Promise<void> => {
      await updateStore((currentStore, nowIso) => upsertAudioRecordingInStore(currentStore, recording, nowIso));
    },
    [updateStore]
  );

  const saveCompletedSession = useCallback(
    async (session: TrainingSession): Promise<void> => {
      await updateStore((currentStore, nowIso) => completeTrainingSession(currentStore, session, nowIso));
    },
    [updateStore]
  );

  const saveLastSessionSettings = useCallback(
    async (settings: TrainingSessionSettings): Promise<void> => {
      await updateStore((currentStore, nowIso) => saveLastSessionSettingsInStore(currentStore, settings, nowIso));
    },
    [updateStore]
  );

  const markWordSuccess = useCallback(
    async (wordId: string): Promise<void> => {
      await updateStore((currentStore, nowIso) => markTrainingWordSuccess(currentStore, wordId, nowIso));
    },
    [updateStore]
  );

  const value = useMemo(
    () => ({
      store,
      isHydrated,
      errorMessage: loadFailed ? t('home.trainingLoadError') : null,
      saveStore,
      upsertWord,
      upsertRecording,
      saveCompletedSession,
      saveLastSessionSettings,
      markWordSuccess,
      pendingSession,
      setPendingSession,
      clearPendingSession,
      interruptedSession,
      dismissInterruptedSession,
    }),
    [
      clearPendingSession,
      dismissInterruptedSession,
      loadFailed,
      t,
      interruptedSession,
      isHydrated,
      markWordSuccess,
      pendingSession,
      saveCompletedSession,
      saveLastSessionSettings,
      saveStore,
      setPendingSession,
      store,
      upsertRecording,
      upsertWord,
    ]
  );

  return <TrainingDataContext.Provider value={value}>{children}</TrainingDataContext.Provider>;
}

// 네이티브 엔진의 중단 기록을 감지해, 정상 완료 또는 5분 이상 진행한 세션을 학습 store에 반영한다.
// store 저장이 성공한 뒤에만 네이티브 기록을 지워 다음 실행에서 안전하게 재시도할 수 있게 한다.
async function restoreOrRecoverSession(
  loadedStore: TrainingStore,
): Promise<{ store: TrainingStore; interrupted: InterruptedSessionInfo | null; pending: PendingSession | null }> {
  const record = await sessionAudioEngine.getPendingRecovery();
  if (!record) return { store: loadedStore, interrupted: null, pending: null };

  const activeSnapshot = await sessionAudioEngine.getSnapshot();
  if (
    activeSnapshot?.sessionId === record.snapshot.sessionId &&
    ['starting', 'running', 'paused', 'interrupted'].includes(activeSnapshot.state)
  ) {
    return {
      store: loadedStore,
      interrupted: { kind: 'active', word: record.recovery.word, creditedLearningSeconds: 0 },
      pending: {
        sessionId: record.snapshot.sessionId,
        wordId: record.recovery.wordId,
        word: record.recovery.word,
        settings: {
          wordId: record.recovery.wordId,
          sourceType: record.recovery.sourceType,
          totalDurationSeconds: record.totalDurationMs / 1000,
          learningDurationSeconds: record.learningDurationMs / 1000,
          restDurationSeconds: record.restDurationMs / 1000,
          libraryEntryId: record.recovery.libraryEntryId,
        },
      },
    };
  }

  const elapsedRunningSeconds = Math.floor(record.snapshot.elapsedRunningMs / 1000);
  if (record.reason !== 'duration-reached' && elapsedRunningSeconds < STREAK_QUALIFYING_SECONDS) {
    await clearRecoverySafely(record.snapshot.sessionId);
    return { store: loadedStore, interrupted: null, pending: null };
  }

  try {
    const learnSecs = record.learningDurationMs / 1000;
    const restSecs = record.restDurationMs / 1000;
    const creditedLearningSeconds = elapsedLearningSeconds(
      record.snapshot.cycle,
      record.snapshot.phase,
      Math.floor(record.snapshot.phaseElapsedMs / 1000),
      learnSecs,
    );

    const endedAt = new Date().toISOString();
    const session = {
      ...createTrainingSession(
      {
        wordId: record.recovery.wordId,
        sourceType: record.recovery.sourceType,
        totalDurationSeconds: record.totalDurationMs / 1000,
        learningDurationSeconds: learnSecs,
        restDurationSeconds: restSecs,
        completedCycles: completedCyclesAtPosition(
          record.snapshot.cycle,
          record.snapshot.phase,
          Math.floor(record.snapshot.phaseElapsedMs / 1000),
          restSecs,
        ),
        totalLearningSeconds: creditedLearningSeconds,
        startedAt: record.recovery.startedAt,
        endedAt,
        libraryEntryId: record.recovery.libraryEntryId,
      },
      endedAt,
      ),
      id: record.snapshot.sessionId,
    };
    const nextStore = completeTrainingSession(loadedStore, session, endedAt);
    const captures = await sessionAudioEngine.getUnstoredSegments();
    await storeNativeCapturedSegments(
      captures.filter((capture) => capture.sessionId === record.snapshot.sessionId),
      record.recovery.wordId,
    );
    await saveTrainingStore(nextStore);
    await clearRecoverySafely(record.snapshot.sessionId);
    return {
      store: nextStore,
      interrupted: { kind: 'recovered', word: record.recovery.word, creditedLearningSeconds },
      pending: null,
    };
  } catch (error: unknown) {
    reportError(error, { scope: 'training.sessionAudio.recover' });
    return { store: loadedStore, interrupted: null, pending: null };
  }
}

async function clearRecoverySafely(sessionId: string): Promise<void> {
  await sessionAudioEngine.clearPendingRecovery(sessionId).catch((error: unknown) => {
    reportError(error, { scope: 'training.sessionAudio.clearRecovery' });
  });
}

function cloneTrainingStore(store: TrainingStore): TrainingStore {
  return {
    ...store,
    wordsById: cloneRecord(store.wordsById),
    recordingsById: cloneRecord(store.recordingsById),
    sessionsById: cloneRecord(store.sessionsById),
    wordProgressByWordId: cloneRecord(store.wordProgressByWordId),
    lastSessionSettings: store.lastSessionSettings ? { ...store.lastSessionSettings } : undefined,
  };
}

function cloneRecord<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, { ...value }])) as Record<string, T>;
}

export function useTrainingData(): TrainingDataContextValue {
  const context = use(TrainingDataContext);

  if (!context) {
    throw new Error('useTrainingData must be used inside TrainingDataProvider');
  }

  return context;
}
