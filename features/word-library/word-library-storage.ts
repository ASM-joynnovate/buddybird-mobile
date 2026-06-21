import { persistKeyedStore } from '@/features/shared/persist-keyed-store';

import type { WordLibraryStore } from './word-library-types';

export const WORD_LIBRARY_STORAGE_KEY = '@buddybird/wordLibrary';

// 오디오 URI normalize(save)/hydrate(load)는 seam이 소유한다 — 컬렉션·필드만 선언.
// 중첩 `pitchTransform.transformedUri` 도 함께 정규화/hydration 하여 재빌드 후 stale 절대 URI 를 방지.
const AUDIO_URI_FIELDS = ['audioUri', 'transformedAudioUri', 'pitchTransform.transformedUri'] as const;

function createEmptyStore(): WordLibraryStore {
  return { version: 1, entriesById: {}, updatedAt: new Date().toISOString() };
}

// 비어 있지 않은 손상 데이터는 fallback(빈 store)으로 떨어뜨린다.
// entriesById가 객체가 아니면 hydration이 불가능하므로 손상으로 간주.
function parseWordLibraryStore(raw: unknown): WordLibraryStore {
  if (!raw || typeof raw !== 'object') {
    throw new Error('손상된 단어 라이브러리 데이터입니다.');
  }
  const { entriesById } = raw as { entriesById?: unknown };
  if (!entriesById || typeof entriesById !== 'object') {
    throw new Error('손상된 단어 라이브러리 데이터입니다.');
  }
  return raw as WordLibraryStore;
}

const wordLibraryStore = persistKeyedStore<WordLibraryStore>({
  key: WORD_LIBRARY_STORAGE_KEY,
  scope: 'word-library.loadStore',
  parse: parseWordLibraryStore,
  fallback: createEmptyStore,
  audioUriCollections: [{ collection: 'entriesById', fields: AUDIO_URI_FIELDS }],
});

export async function loadWordLibraryStore(): Promise<WordLibraryStore> {
  return wordLibraryStore.load();
}

export async function saveWordLibraryStore(store: WordLibraryStore): Promise<void> {
  await wordLibraryStore.save(store);
}
