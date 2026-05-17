import type { TrainingAudioSourceType } from './training-types';


export const SESSION_PRESETS = [
  {
    key: 'long', shortLabel: '짧게',
    description: '\'10분 학습 + 5분 휴식\'이 2번 반복됩니다.',
    learnSecs: 600, restSecs: 300, cycles: 2,
  },
  {
    key: 'short', shortLabel: '중간',
    description: '\'10분 학습 + 5분 휴식\'이 4번 반복됩니다.',
    learnSecs: 600, restSecs: 300, cycles: 4,
  },
  {
    key: 'medium', shortLabel: '길게',
    description: '\'10분 학습 + 5분 휴식\'이 12번 반복됩니다.',
    learnSecs: 600, restSecs: 300, cycles: 12,
  },
] as const;

export type SessionPresetKey = 'short' | 'medium' | 'long' | 'custom';

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
