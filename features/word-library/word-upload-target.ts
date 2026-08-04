// 업로드 대상 단어 선별 (SPEC-0003 §단어 업로드 — 대상). 순수 함수 — I/O 없음.

import type { WordEntry } from './word-library-types';

/** 한 번의 flush 가 다룰 범위. 단어 생성은 그 1건, 나머지 트리거는 전체다. */
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
 * 사용자 생성 단어를 오래된 순서로 고른다.
 *
 * 첫 배포에서는 처리 기록을 두지 않아 전송 여부와 무관하게 매번 전체를 고른다 (BB-238 결정).
 * 서버에서 데이터가 지워져도 다음 콜드 스타트에 회수되게 하려는 것이며, 서버가
 * `(firebase_anon_uid, client_word_id)` 멱등이라 중복 행은 생기지 않는다.
 * 재전송을 거르는 규칙은 다음 업데이트에서 논의해 넣는다.
 *
 * 프리셋 단어는 서버가 시드하므로 제외한다.
 */
export function selectUploadableWords(entries: readonly WordEntry[]): WordEntry[] {
  return entries
    .filter((entry) => entry.sourceType === 'recording')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
