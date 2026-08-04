// 캡처 등록 시점 메타(치환 단어 id·프로필 스냅샷) 계산. 순수 함수만 — I/O 없음.
// flush 의 legacy 백필도 같은 함수를 재사용해 등록 시점과 규칙을 일치시킨다.

import type { ParrotProfile } from '@/features/profile/profile-types';

import type { TrainingWord } from './training-types';

export interface CaptureRegistrationMeta {
  clientWordId: string;
  parrotSpecies: string | null;
  parrotBirthdate: string | null;
}

// 서버 계약(client_word_id): 프리셋 단어는 preset-<presetKey>, 그 외에는 WordLibrary 역참조 id(wentry-…).
// 단어 조회 실패(삭제 등) 시 원본 wordId 로 강등 — 서버 단어 조인은 NULL 이 된다.
export function resolveClientWordId(
  wordId: string,
  word: Pick<TrainingWord, 'presetKey' | 'libraryEntryId'> | undefined,
): string {
  if (word?.presetKey) return `preset-${word.presetKey}`;
  if (word?.libraryEntryId) return word.libraryEntryId;
  return wordId;
}

export function buildCaptureRegistrationMeta(
  wordId: string,
  word: Pick<TrainingWord, 'presetKey' | 'libraryEntryId'> | undefined,
  profile: Pick<ParrotProfile, 'species' | 'birthDate'> | null,
): CaptureRegistrationMeta {
  return {
    clientWordId: resolveClientWordId(wordId, word),
    parrotSpecies: profile?.species ?? null,
    parrotBirthdate: profile?.birthDate ?? null,
  };
}
