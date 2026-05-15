import type { TrainingAudioSourceType } from './training-types';

export const STEP_SESSION_MINS = 5;
export const STEP_LEARN_SECS = 10;
export const STEP_REST_SECS = 5;

export const PRESET_WORDS = [
  { key: 'hello', word: '안녕',    cat: '인사' },
  { key: 'apple', word: '사과',    cat: '음식' },
  { key: 'water', word: '물',      cat: '음식' },
  { key: 'bye',   word: '잘 다녀와', cat: '인사' },
] as const;

export type PresetWord = (typeof PRESET_WORDS)[number];

export type SessionStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface SessionMeta {
  wordId: string;
  startedAt: string;
  sourceType: TrainingAudioSourceType;
  totalDurationSeconds: number;
  learningDurationSeconds: number;
  restDurationSeconds: number;
}
