import { WORD_TAGS, type WordTag } from './word-library-types';

// 필터 카테고리 키 — 표시 라벨은 i18n(`wordLibrary.filterAll` / `wordLibrary.tagLabels.*`)으로 해석한다.
export type WordCategory = 'all' | WordTag;

export const CATS: readonly WordCategory[] = ['all', ...WORD_TAGS];
