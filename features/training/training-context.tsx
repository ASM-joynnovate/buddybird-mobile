import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';

import {
  completeTrainingSession,
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
  audioUri?: string;
  word: string;
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
}

const TrainingDataContext = createContext<TrainingDataContextValue | null>(null);

export function TrainingDataProvider({ children }: PropsWithChildren) {
  const [store, setStore] = useState<TrainingStore | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingSession, setPendingSessionState] = useState<PendingSession | null>(null);
  const storeRef = useRef<TrainingStore | null>(null);
  const writeQueueRef = useRef(Promise.resolve());

  const setPendingSession = useCallback((next: PendingSession): void => {
    setPendingSessionState(next);
  }, []);

  const clearPendingSession = useCallback((): void => {
    setPendingSessionState(null);
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

        if (isMounted) {
          setTrainingStoreState(storedTrainingStore);
          setErrorMessage(null);
        }
      } catch (error: unknown) {
        if (isMounted) {
          setTrainingStoreState(null);
          setErrorMessage(error instanceof Error ? error.message : '학습 데이터를 불러오지 못했습니다.');
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
    const nextWrite = writeQueueRef.current.then(operation, operation);
    // queue를 깨지 않기 위해 reject를 swallow한다. 호출자에게는 nextWrite로 reject가 전파됨.
    writeQueueRef.current = nextWrite.catch((error: unknown) => {
      console.warn('[training] write queue operation failed:', error);
    });

    return nextWrite;
  }, [setTrainingStoreState]);

  const saveStore = useCallback(
    async (nextStore: TrainingStore): Promise<void> =>
      enqueueWrite(async () => {
        await saveTrainingStore(nextStore);
        setTrainingStoreState(nextStore);
        setErrorMessage(null);
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
        setErrorMessage(null);
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
      errorMessage,
      saveStore,
      upsertWord,
      upsertRecording,
      saveCompletedSession,
      saveLastSessionSettings,
      markWordSuccess,
      pendingSession,
      setPendingSession,
      clearPendingSession,
    }),
    [
      clearPendingSession,
      errorMessage,
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
  const context = useContext(TrainingDataContext);

  if (!context) {
    throw new Error('useTrainingData must be used inside TrainingDataProvider');
  }

  return context;
}
