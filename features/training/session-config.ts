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

export const PERSONAS = [
  { id: 'child',  label: '아이 톤',    range: '2.5–3.5 kHz' },
  { id: 'female', label: '여성 톤',    range: '1.5–2.5 kHz' },
  { id: 'bird',   label: '새 모방 톤', range: '3.5–4.0 kHz' },
] as const;

export type PersonaId = (typeof PERSONAS)[number]['id'];

export type SessionStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface SessionMeta {
  wordId: string;
  startedAt: string;
  sourceType: TrainingAudioSourceType;
  totalDurationSeconds: number;
  learningDurationSeconds: number;
  restDurationSeconds: number;
}
