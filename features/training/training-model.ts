import type {
  AudioRecording,
  CreateTrainingSessionInput,
  CreateTrainingWordInput,
  TrainingSession,
  TrainingSessionSettings,
  TrainingStore,
  TrainingWord,
  TrainingWordProgress,
  TrainingWordSummary,
} from './training-types';

export function createEmptyTrainingStore(nowIso: string): TrainingStore {
  return {
    version: 1,
    wordsById: {},
    recordingsById: {},
    sessionsById: {},
    wordProgressByWordId: {},
    updatedAt: nowIso,
  };
}

export function createTrainingWord(input: CreateTrainingWordInput, nowIso: string): TrainingWord {
  return {
    id: createEntityId('word', nowIso),
    label: input.label.trim(),
    locale: input.locale,
    sourceType: input.sourceType,
    presetKey: input.presetKey,
    audioUri: input.audioUri,
    transformedAudioUri: input.transformedAudioUri,
    recordingId: input.recordingId,
    pitchTransform: input.pitchTransform,
    libraryEntryId: input.libraryEntryId,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export function createTrainingSession(input: CreateTrainingSessionInput, nowIso: string): TrainingSession {
  return {
    id: createEntityId('session', nowIso),
    wordId: input.wordId,
    sourceType: input.sourceType,
    totalDurationSeconds: input.totalDurationSeconds,
    learningDurationSeconds: input.learningDurationSeconds,
    restDurationSeconds: input.restDurationSeconds,
    completedCycles: input.completedCycles,
    totalLearningSeconds: input.totalLearningSeconds,
    startedAt: input.startedAt ?? nowIso,
    endedAt: input.endedAt,
    libraryEntryId: input.libraryEntryId,
  };
}

export function upsertTrainingWord(store: TrainingStore, word: TrainingWord, nowIso: string): TrainingStore {
  return {
    ...store,
    wordsById: {
      ...store.wordsById,
      [word.id]: { ...word },
    },
    updatedAt: nowIso,
  };
}

export function upsertAudioRecording(store: TrainingStore, recording: AudioRecording, nowIso: string): TrainingStore {
  return {
    ...store,
    recordingsById: {
      ...store.recordingsById,
      [recording.id]: { ...recording },
    },
    updatedAt: nowIso,
  };
}

export function saveLastSessionSettings(store: TrainingStore, settings: TrainingSessionSettings, nowIso: string): TrainingStore {
  assertTrainingWordExists(store, settings.wordId);

  return {
    ...store,
    lastSessionSettings: {
      wordId: settings.wordId,
      sourceType: settings.sourceType,
      totalDurationSeconds: settings.totalDurationSeconds,
      learningDurationSeconds: settings.learningDurationSeconds,
      restDurationSeconds: settings.restDurationSeconds,
      libraryEntryId: settings.libraryEntryId,
    },
    updatedAt: nowIso,
  };
}

export function completeTrainingSession(store: TrainingStore, session: TrainingSession, nowIso: string): TrainingStore {
  assertTrainingWordExists(store, session.wordId);
  if (store.sessionsById[session.id]) return store;

  const currentProgress = store.wordProgressByWordId[session.wordId];
  const nextProgress: TrainingWordProgress = {
    wordId: session.wordId,
    totalTrainingSeconds: (currentProgress?.totalTrainingSeconds ?? 0) + session.totalLearningSeconds,
    sessionCount: (currentProgress?.sessionCount ?? 0) + 1,
    successMarkedAt: currentProgress?.successMarkedAt,
    updatedAt: nowIso,
  };

  return {
    ...store,
    sessionsById: {
      ...store.sessionsById,
      [session.id]: { ...session, endedAt: session.endedAt ?? nowIso },
    },
    wordProgressByWordId: {
      ...store.wordProgressByWordId,
      [session.wordId]: nextProgress,
    },
    lastSessionSettings: {
      wordId: session.wordId,
      sourceType: session.sourceType,
      totalDurationSeconds: session.totalDurationSeconds,
      learningDurationSeconds: session.learningDurationSeconds,
      restDurationSeconds: session.restDurationSeconds,
      libraryEntryId: session.libraryEntryId,
    },
    updatedAt: nowIso,
  };
}

export function markTrainingWordSuccess(store: TrainingStore, wordId: string, nowIso: string): TrainingStore {
  assertTrainingWordExists(store, wordId);

  const currentProgress = store.wordProgressByWordId[wordId];
  const nextProgress: TrainingWordProgress = {
    wordId,
    totalTrainingSeconds: currentProgress?.totalTrainingSeconds ?? 0,
    sessionCount: currentProgress?.sessionCount ?? 0,
    successMarkedAt: nowIso,
    updatedAt: nowIso,
  };

  return {
    ...store,
    wordProgressByWordId: {
      ...store.wordProgressByWordId,
      [wordId]: nextProgress,
    },
    updatedAt: nowIso,
  };
}

export function selectTotalTrainingSeconds(store: TrainingStore): number {
  return Object.values(store.wordProgressByWordId).reduce((totalSeconds, progress) => totalSeconds + progress.totalTrainingSeconds, 0);
}

export interface TrainingRewardSummary {
  todayLearningSeconds: number;
  currentStreakDays: number;
}

export function selectTrainingRewardSummary(store: TrainingStore, now: Date = new Date()): TrainingRewardSummary {
  const sessions = Object.values(store.sessionsById).filter((session) => session.totalLearningSeconds > 0);
  const todayKey = toLocalDateKey(now);
  const sessionDateKeys = new Set<string>();
  let todayLearningSeconds = 0;

  for (const session of sessions) {
    const sessionDate = new Date(session.endedAt ?? session.startedAt);
    const sessionDateKey = toLocalDateKey(sessionDate);

    sessionDateKeys.add(sessionDateKey);

    if (sessionDateKey === todayKey) {
      todayLearningSeconds += session.totalLearningSeconds;
    }
  }

  return {
    todayLearningSeconds,
    currentStreakDays: countCurrentStreakDays(sessionDateKeys, now),
  };
}

function createEntityId(prefix: string, nowIso: string): string {
  return `${prefix}-${nowIso}-${Math.random().toString(36).slice(2, 10)}`;
}

function assertTrainingWordExists(store: TrainingStore, wordId: string): void {
  if (!store.wordsById[wordId]) {
    throw new Error('학습 단어를 찾을 수 없습니다.');
  }
}

export function selectTrainingWordSummaries(store: TrainingStore): TrainingWordSummary[] {
  return Object.values(store.wordsById)
    .map((word) => {
      const progress = store.wordProgressByWordId[word.id] ?? {
        wordId: word.id,
        totalTrainingSeconds: 0,
        sessionCount: 0,
        updatedAt: word.updatedAt,
      };

      return {
        word: { ...word },
        progress: { ...progress },
      };
    })
    .sort((left, right) => right.progress.totalTrainingSeconds - left.progress.totalTrainingSeconds);
}

function countCurrentStreakDays(sessionDateKeys: Set<string>, now: Date): number {
  if (sessionDateKeys.size === 0) {
    return 0;
  }

  const cursor = startOfLocalDay(now);

  if (!sessionDateKeys.has(toLocalDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streakDays = 0;

  while (sessionDateKeys.has(toLocalDateKey(cursor))) {
    streakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streakDays;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
