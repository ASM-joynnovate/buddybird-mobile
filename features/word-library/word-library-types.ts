import type { PitchTransformMetadata } from '@/features/audio/audio-types';

export type WordTag = '인사' | '음식' | '이름' | '기타';
export const WORD_TAGS: readonly WordTag[] = ['인사', '음식', '이름', '기타'];
export interface WordEntry {
  id: string;
  label: string;
  tag: WordTag;
  sourceType: 'preset' | 'recording';
  presetKey?: string;
  audioUri: string;
  transformedAudioUri?: string;
  pitchTransform?: PitchTransformMetadata;
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
  pitchTransform?: PitchTransformMetadata;
}

export interface WordLibraryStore {
  version: 1;
  entriesById: Record<string, WordEntry>;
  updatedAt: string;
}
