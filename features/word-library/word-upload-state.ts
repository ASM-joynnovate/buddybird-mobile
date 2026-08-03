// 사용자 생성 단어의 업로드 처리 기록 (SPEC-0003 §단어 업로드 — 상태 저장소).
// 단어 데이터(`word-library-storage`)와 분리해 둔다 — 업로드는 단어의 속성이 아니라
// 전송 이력이고, 섞으면 단어 저장 경로가 업로드 사정으로 흔들린다.

import { persistKeyedStore } from '@/features/shared/persist-keyed-store';

export const WORD_UPLOAD_STATE_STORAGE_KEY = '@buddybird/word-upload-state';

/** `uploaded`는 서버 저장 완료, `failed`는 4xx 거부로 재전송하지 않는 상태 */
export type WordUploadStatus = 'uploaded' | 'failed';

export type WordUploadState = Record<string, { status: WordUploadStatus }>;

const STATUSES: readonly string[] = ['uploaded', 'failed'];

// 깨진 기록은 빈 상태로 되돌린다 — 전량 재전송이 되지만 서버가
// (firebase_anon_uid, client_word_id) 멱등이라 중복 행이 생기지 않는다 (SPEC-0002 §동작).
const store = persistKeyedStore<WordUploadState>({
  key: WORD_UPLOAD_STATE_STORAGE_KEY,
  scope: 'word-library.uploadState.load',
  parse: parseState,
  fallback: () => ({}),
});

export async function loadWordUploadState(): Promise<WordUploadState> {
  return store.load();
}

/** 처리 결과를 기록한다. 같은 `client_word_id`의 기존 기록은 덮어쓴다. */
export async function markWordUploadResult(
  clientWordId: string,
  status: WordUploadStatus,
): Promise<void> {
  const current = await store.load();
  await store.save({ ...current, [clientWordId]: { status } });
}

function parseState(raw: unknown): WordUploadState {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('word upload state is not an object');
  }

  const result: WordUploadState = {};
  for (const [clientWordId, value] of Object.entries(raw as Record<string, unknown>)) {
    const status = value && typeof value === 'object' ? (value as Record<string, unknown>).status : undefined;
    if (typeof status !== 'string' || !STATUSES.includes(status)) {
      throw new Error(`invalid word upload status for ${clientWordId}: ${String(status)}`);
    }
    result[clientWordId] = { status: status as WordUploadStatus };
  }
  return result;
}
