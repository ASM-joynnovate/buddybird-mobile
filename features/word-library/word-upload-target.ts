// 업로드 대상 단어 선별 (SPEC-0003 §단어 업로드 — 대상). 순수 함수 — I/O 없음.

import type { WordEntry } from './word-library-types';
import type { WordUploadState } from './word-upload-state';

/**
 * 아직 서버로 보내지 않은 사용자 생성 단어를 오래된 순서로 고른다.
 *
 * - 프리셋 단어는 서버가 시드하므로 제외한다
 * - `uploaded`·`failed` 어느 쪽이든 처리 기록이 있으면 제외한다 — `failed`는 4xx 거부라
 *   같은 요청을 다시 보내도 같은 결과가 돌아온다
 */
export function selectPendingWords(
  entries: readonly WordEntry[],
  state: WordUploadState,
): WordEntry[] {
  return entries
    .filter((entry) => entry.sourceType === 'recording' && state[entry.id] === undefined)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
