// 업로드 대상 단어 선별 (SPEC-0003 §단어 업로드 — 대상). 순수 함수 — I/O 없음.

import type { WordEntry } from './word-library-types';
import type { WordUploadState } from './word-upload-state';

/** 한 번의 flush 가 다룰 범위. 단어 생성은 그 1건, 나머지 트리거는 미처리 전체다. */
export type UploadTarget = { kind: 'all' } | { kind: 'single'; wordId: string };

/**
 * flush 도중 도착한 트리거의 대상을 앞선 예약과 합친다.
 *
 * 서로 다른 단어를 가리키면 전체로 넓힌다 — 둘 중 하나를 버리면 그 단어가 다음 콜드 스타트까지
 * 남고, 넓혀도 미처리 단어만 고르므로 이미 보낸 단어가 다시 나가지 않는다.
 */
export function mergeUploadTargets(queued: UploadTarget | null, incoming: UploadTarget): UploadTarget {
  if (queued === null) return incoming;
  if (queued.kind === 'all' || incoming.kind === 'all') return { kind: 'all' };
  return queued.wordId === incoming.wordId ? queued : { kind: 'all' };
}

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
