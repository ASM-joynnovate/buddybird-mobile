// 데이터 키 — 표시 라벨은 i18n(`wordLibrary.tagLabels.*`)으로 해석한다.
export type WordTag = 'greeting' | 'food' | 'name' | 'etc';
export const WORD_TAGS: readonly WordTag[] = ['greeting', 'food', 'name', 'etc'];
export interface WordEntry {
  id: string;
  label: string;
  tag: WordTag;
  sourceType: 'preset' | 'recording';
  presetKey?: string;
  audioUri: string;
  transformedAudioUri?: string;
  // 오디오 도메인 pitch 프로필에 대한 불투명 참조. 실제 pitch 파라미터(배속 등) 해석은
  // 오디오 도메인(`features/audio/pitch-profile`)이 소유한다.
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
