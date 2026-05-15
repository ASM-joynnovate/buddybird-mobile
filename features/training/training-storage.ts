import AsyncStorage from '@react-native-async-storage/async-storage';

import { createEmptyTrainingStore } from './training-model';
import type { TrainingStore } from './training-types';
import { parseStoredTrainingStore, TrainingStorageError } from './training-validation';

export const TRAINING_STORAGE_KEY = '@pethub/training-store';

export async function loadTrainingStore(): Promise<TrainingStore> {
  const rawStore = await AsyncStorage.getItem(TRAINING_STORAGE_KEY);

  if (!rawStore) {
    return createEmptyTrainingStore(new Date().toISOString());
  }

  try {
    return parseStoredTrainingStore(JSON.parse(rawStore));
  } catch (error: unknown) {
    console.warn('[training] failed to parse stored training data:', error);
    throw new TrainingStorageError('저장된 학습 데이터를 읽을 수 없습니다.');
  }
}

export async function saveTrainingStore(store: TrainingStore): Promise<void> {
  await AsyncStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(store));
}
