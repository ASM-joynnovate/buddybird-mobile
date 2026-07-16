import { persistKeyedStore } from '@/features/shared/persist-keyed-store';

import type { WordLibraryStore, WordTag } from './word-library-types';

export const WORD_LIBRARY_STORAGE_KEY = '@buddybird/wordLibrary';

// 오디오 URI normalize(save)/hydrate(load)는 seam이 소유한다 — 컬렉션·필드만 선언.
// WordEntry 는 pitch 프로필을 불투명 id 로만 참조하므로 변환본 URI 는 top-level
// `transformedAudioUri` 한 곳에만 존재한다(중첩 URI 없음). stale 절대 URI 방지 invariant 유지.
const AUDIO_URI_FIELDS = ['audioUri', 'transformedAudioUri'] as const;

function createEmptyStore(): WordLibraryStore {
  return { version: 1, entriesById: {}, updatedAt: new Date().toISOString() };
}

// ≤0.7.x 는 tag 에 한국어 값을 저장했다 (BB-155 에서 영문 키로 전환) — hydrate 시 1회 이관.
const LEGACY_TAG_MAP: Record<string, WordTag> = {
  인사: 'greeting',
  음식: 'food',
  이름: 'name',
  기타: 'etc',
};

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
  const store = raw as WordLibraryStore;
  for (const entry of Object.values(store.entriesById)) {
    // 손상된 엔트리 때문에 parse 전체가 throw 되면 fallback(빈 store)으로 유실된다 — 건너뛰고 나머지를 살린다.
    if (!entry || typeof entry !== 'object') continue;
    const migrated = LEGACY_TAG_MAP[entry.tag as string];
    if (migrated) entry.tag = migrated;
  }
  return store;
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
