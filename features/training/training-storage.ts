import AsyncStorage from '@react-native-async-storage/async-storage';

import { reportError } from '@/features/analytics/error-reporter';
import { hydrateAudioUriFromStorage, normalizeAudioUriForStorage } from '@/features/audio/audio-file-storage';

import { createEmptyTrainingStore } from './training-model';
import type { AudioRecording, TrainingStore, TrainingWord } from './training-types';
import { parseStoredTrainingStore, TrainingStorageError } from './training-validation';

export const TRAINING_STORAGE_KEY = '@pethub/training-store';

export async function loadTrainingStore(): Promise<TrainingStore> {
  const rawStore = await AsyncStorage.getItem(TRAINING_STORAGE_KEY);

  if (!rawStore) {
    return createEmptyTrainingStore(new Date().toISOString());
  }

  try {
    const parsed = parseStoredTrainingStore(JSON.parse(rawStore));
    return hydrateTrainingStore(parsed);
  } catch (error: unknown) {
    reportError(error, { scope: 'training.loadStore' });
    throw new TrainingStorageError('저장된 학습 데이터를 읽을 수 없습니다.');
  }
}

export async function saveTrainingStore(store: TrainingStore): Promise<void> {
  const normalized = normalizeTrainingStoreForStorage(store);
  await AsyncStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(normalized));
}

function normalizeTrainingStoreForStorage(store: TrainingStore): TrainingStore {
  return {
    ...store,
    wordsById: mapRecord(store.wordsById, normalizeWordForStorage),
    recordingsById: mapRecord(store.recordingsById, normalizeRecordingForStorage),
  };
}

function hydrateTrainingStore(store: TrainingStore): TrainingStore {
  return {
    ...store,
    wordsById: mapRecord(store.wordsById, hydrateWord),
    recordingsById: mapRecord(store.recordingsById, hydrateRecording),
  };
}

function normalizeWordForStorage(word: TrainingWord): TrainingWord {
  return {
    ...word,
    audioUri: normalizeAudioUriForStorage(word.audioUri) ?? word.audioUri,
    transformedAudioUri: normalizeAudioUriForStorage(word.transformedAudioUri),
  };
}

function hydrateWord(word: TrainingWord): TrainingWord {
  return {
    ...word,
    audioUri: hydrateAudioUriFromStorage(word.audioUri) ?? word.audioUri,
    transformedAudioUri: hydrateAudioUriFromStorage(word.transformedAudioUri),
  };
}

function normalizeRecordingForStorage(recording: AudioRecording): AudioRecording {
  return {
    ...recording,
    originalUri: normalizeAudioUriForStorage(recording.originalUri) ?? recording.originalUri,
    transformedUri: normalizeAudioUriForStorage(recording.transformedUri),
  };
}

function hydrateRecording(recording: AudioRecording): AudioRecording {
  return {
    ...recording,
    originalUri: hydrateAudioUriFromStorage(recording.originalUri) ?? recording.originalUri,
    transformedUri: hydrateAudioUriFromStorage(recording.transformedUri),
  };
}

function mapRecord<T>(record: Record<string, T>, transform: (value: T) => T): Record<string, T> {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, transform(value)]));
}
