import type {
  AudioPitchTransform,
  AudioRecording,
  TrainingAudioSourceType,
  TrainingSession,
  TrainingSessionSettings,
  TrainingStore,
  TrainingWord,
  TrainingWordProgress,
} from './training-types';

export class TrainingStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TrainingStorageError';
  }
}

export function parseStoredTrainingStore(value: unknown): TrainingStore {
  if (!isStoredTrainingStore(value)) {
    throw new TrainingStorageError('저장된 학습 데이터 형식이 올바르지 않습니다.');
  }

  return {
    version: 1,
    wordsById: cloneRecord(value.wordsById),
    recordingsById: cloneRecord(value.recordingsById),
    sessionsById: cloneRecord(value.sessionsById),
    wordProgressByWordId: cloneRecord(value.wordProgressByWordId),
    lastSessionSettings: value.lastSessionSettings ? { ...value.lastSessionSettings } : undefined,
    updatedAt: value.updatedAt,
  };
}

function cloneRecord<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, { ...value }])) as Record<string, T>;
}

function isStoredTrainingStore(value: unknown): value is TrainingStore {
  if (!isRecord(value)) {
    return false;
  }

  const store = value as Partial<TrainingStore>;

  return (
    store.version === 1 &&
    isRecordOf(store.wordsById, isTrainingWord) &&
    isRecordOf(store.recordingsById, isAudioRecording) &&
    isRecordOf(store.sessionsById, isTrainingSession) &&
    isRecordOf(store.wordProgressByWordId, isTrainingWordProgress) &&
    (store.lastSessionSettings === undefined || isTrainingSessionSettings(store.lastSessionSettings)) &&
    typeof store.updatedAt === 'string'
  );
}

function isTrainingWord(value: unknown): value is TrainingWord {
  if (!isRecord(value)) {
    return false;
  }

  const word = value as Partial<TrainingWord>;

  return (
    typeof word.id === 'string' &&
    typeof word.label === 'string' &&
    typeof word.locale === 'string' &&
    isTrainingAudioSourceType(word.sourceType) &&
    typeof word.audioUri === 'string' &&
    typeof word.createdAt === 'string' &&
    typeof word.updatedAt === 'string' &&
    (word.presetKey === undefined || typeof word.presetKey === 'string') &&
    (word.transformedAudioUri === undefined || typeof word.transformedAudioUri === 'string') &&
    (word.recordingId === undefined || typeof word.recordingId === 'string') &&
    (word.pitchTransform === undefined || isAudioPitchTransform(word.pitchTransform))
  );
}

function isAudioRecording(value: unknown): value is AudioRecording {
  if (!isRecord(value)) {
    return false;
  }

  const recording = value as Partial<AudioRecording>;

  return (
    typeof recording.id === 'string' &&
    typeof recording.originalUri === 'string' &&
    typeof recording.createdAt === 'string' &&
    typeof recording.updatedAt === 'string' &&
    (recording.transformedUri === undefined || typeof recording.transformedUri === 'string') &&
    (recording.durationSeconds === undefined || isNonNegativeFiniteNumber(recording.durationSeconds)) &&
    (recording.pitchTransform === undefined || isAudioPitchTransform(recording.pitchTransform))
  );
}

function isAudioPitchTransform(value: unknown): value is AudioPitchTransform {
  if (!isRecord(value)) {
    return false;
  }

  const transform = value as Partial<AudioPitchTransform>;

  return (
    transform.profileId === 'parrot-mvp-high' &&
    isPositiveFiniteNumber(transform.playbackRate) &&
    typeof transform.preservesPitch === 'boolean' &&
    typeof transform.appliedAt === 'string' &&
    (transform.transformedUri === undefined || typeof transform.transformedUri === 'string')
  );
}

function isTrainingSession(value: unknown): value is TrainingSession {
  if (!isRecord(value) || !isTrainingSessionSettings(value)) {
    return false;
  }

  const session = value as Partial<TrainingSession>;

  return (
    typeof session.id === 'string' &&
    isNonNegativeInteger(session.completedCycles) &&
    isNonNegativeFiniteNumber(session.totalLearningSeconds) &&
    typeof session.startedAt === 'string' &&
    (session.endedAt === undefined || typeof session.endedAt === 'string')
  );
}

function isTrainingSessionSettings(value: unknown): value is TrainingSessionSettings {
  if (!isRecord(value)) {
    return false;
  }

  const settings = value as Partial<TrainingSessionSettings>;

  return (
    typeof settings.wordId === 'string' &&
    isTrainingAudioSourceType(settings.sourceType) &&
    isPositiveFiniteNumber(settings.totalDurationSeconds) &&
    isPositiveFiniteNumber(settings.learningDurationSeconds) &&
    isNonNegativeFiniteNumber(settings.restDurationSeconds)
  );
}

function isTrainingWordProgress(value: unknown): value is TrainingWordProgress {
  if (!isRecord(value)) {
    return false;
  }

  const progress = value as Partial<TrainingWordProgress>;

  return (
    typeof progress.wordId === 'string' &&
    isNonNegativeFiniteNumber(progress.totalTrainingSeconds) &&
    isNonNegativeInteger(progress.sessionCount) &&
    typeof progress.updatedAt === 'string' &&
    (progress.successMarkedAt === undefined || typeof progress.successMarkedAt === 'string')
  );
}

function isTrainingAudioSourceType(value: unknown): value is TrainingAudioSourceType {
  return value === 'preset' || value === 'recording';
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function isRecordOf<T>(value: unknown, itemGuard: (item: unknown) => item is T): value is Record<string, T> {
  return isRecord(value) && Object.values(value).every(itemGuard);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
