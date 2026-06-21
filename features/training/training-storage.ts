import { persistKeyedStore } from '@/features/shared/persist-keyed-store';

import { createEmptyTrainingStore } from './training-model';
import type { TrainingStore } from './training-types';
import { parseStoredTrainingStore, TrainingStorageError } from './training-validation';

export const TRAINING_STORAGE_KEY = '@buddybird/training-store';

// 오디오 URI normalize(save)/hydrate(load)는 seam이 소유한다 — 컬렉션·필드만 선언.
// TrainingWord(audioUri/transformedAudioUri)와 AudioRecording(originalUri/transformedUri) 두 컬렉션.
// 중첩 `pitchTransform.transformedUri`(둘 다 보유) 도 함께 커버해 stale 절대 URI 를 방지.
const AUDIO_URI_COLLECTIONS = [
  { collection: 'wordsById', fields: ['audioUri', 'transformedAudioUri', 'pitchTransform.transformedUri'] },
  { collection: 'recordingsById', fields: ['originalUri', 'transformedUri', 'pitchTransform.transformedUri'] },
] as const;

const trainingStore = persistKeyedStore<TrainingStore>({
  key: TRAINING_STORAGE_KEY,
  scope: 'training.loadStore',
  parse: parseStoredTrainingStore,
  // 미저장(키 없음) 시에만 빈 store를 반환한다.
  fallback: () => createEmptyTrainingStore(new Date().toISOString()),
  // word-library와 달리 training은 손상 데이터를 fallback 하지 않고 표면화한다.
  // seam이 이미 reportError(scope)를 호출했으므로 여기서는 일반 메시지로 throw만 한다.
  // parse가 던지는 구체 메시지·JSON.parse SyntaxError 모두 이 일반 메시지로 치환된다.
  recover: () => {
    throw new TrainingStorageError('저장된 학습 데이터를 읽을 수 없습니다.');
  },
  audioUriCollections: AUDIO_URI_COLLECTIONS,
});

export async function loadTrainingStore(): Promise<TrainingStore> {
  return trainingStore.load();
}

export async function saveTrainingStore(store: TrainingStore): Promise<void> {
  await trainingStore.save(store);
}
