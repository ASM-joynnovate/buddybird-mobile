// 데이터 키 — 표시 라벨은 i18n(`wordLibrary.tagLabels.*`)으로 해석한다.
export type WordTag = 'greeting' | 'food' | 'name' | 'etc';
export const WORD_TAGS: readonly WordTag[] = ['greeting', 'food', 'name', 'etc'];

// 단어 이름 상한 — 입력란 maxLength 와 서버 업로드 절단(SPEC-0002 §단어 업로드)이 공유하는 단일 출처.
export const WORD_LABEL_MAX_LENGTH = 50;

export interface WordEntry {
  id: string;
  label: string;
  tag: WordTag;
  sourceType: 'preset' | 'recording';
  presetKey?: string;
  audioUri: string;
  transformedAudioUri?: string;
  // 과거 pitch 변환 기능이 남긴 참조 — 재생에는 더 이상 사용하지 않는다 (BB-248).
  // 기존 저장 데이터 호환을 위해 필드만 유지한다.
  pitchProfileId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWordEntryInput {
  label: string;
  tag: WordTag;
  sourceType: 'preset' | 'recording';
  presetKey?: string;
  audioUri: string;
  transformedAudioUri?: string;
  pitchProfileId?: string;
}

export interface WordLibraryStore {
  version: 1;
  entriesById: Record<string, WordEntry>;
  updatedAt: string;
}
