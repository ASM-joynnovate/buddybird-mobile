import type { TrainingAudioSourceType } from './training-types';


export const SESSION_PRESETS = [
  {
    key: 'long', shortLabel: '짧게',
    description: '샤워하거나 잠시 자리를 비울 때',
    learnSecs: 600, restSecs: 300, cycles: 2,
  },
  {
    key: 'short', shortLabel: '중간',
    description: '짧은 외출로 자리를 비울 때',
    learnSecs: 600, restSecs: 300, cycles: 4,
  },
  {
    key: 'medium', shortLabel: '길게',
    description: '여행 등으로 인해 길게 자리를 비울 때',
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

export function calcLearnRestFromTotal(totalSecs: number): { learnSecs: number; restSecs: number } {
  const n = Math.max(1, Math.round(totalSecs / 900));
  const secsPerCycle = totalSecs / n;
  const learnSecs = Math.max(60, Math.round((secsPerCycle * 2) / 3 / 60) * 60);
  const restSecs = Math.max(60, Math.round(secsPerCycle / 3 / 60) * 60);
  return { learnSecs, restSecs };
}
