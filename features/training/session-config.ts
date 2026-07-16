import type { TrainingAudioSourceType } from './training-types';
import type { SessionEngineState } from '@/modules/session-audio-engine';


export const SESSION_PRESETS = [
  {
    key: 'short', shortLabel: '짧게',
    description: '샤워하거나 잠시 자리를 비울 때',
    learnSecs: 600, restSecs: 300, cycles: 2,
  },
  {
    key: 'medium', shortLabel: '중간',
    description: '짧은 외출로 자리를 비울 때',
    learnSecs: 600, restSecs: 300, cycles: 4,
  },
  {
    key: 'long', shortLabel: '길게',
    description: '여행 등으로 인해 길게 자리를 비울 때',
    learnSecs: 600, restSecs: 300, cycles: 12,
  },
] as const;

export type SessionPresetKey = 'short' | 'medium' | 'long' | 'custom';

export type SessionStatus = SessionEngineState;

export interface SessionMeta {
  wordId: string;
  startedAt: string;
  sourceType: TrainingAudioSourceType;
  totalDurationSeconds: number;
  learningDurationSeconds: number;
  restDurationSeconds: number;
  libraryEntryId?: string;
}

export function calcLearnRestFromTotal(totalSecs: number): { learnSecs: number; restSecs: number } {
  if (totalSecs <= 0) return { learnSecs: 0, restSecs: 0 };
  const n = Math.max(1, Math.round(totalSecs / 900));
  const secsPerCycle = Math.round(totalSecs / n);
  const rawLearn = Math.max(60, Math.round((secsPerCycle * 2) / 3 / 60) * 60);
  const rawRest = Math.max(60, secsPerCycle - rawLearn);

  if (rawLearn + rawRest <= secsPerCycle) {
    return { learnSecs: rawLearn, restSecs: rawRest };
  }

  // 최솟값 강제로 secsPerCycle 초과 시 → 2:1 비율로 축소 (분 반올림 없음)
  const learnSecs = Math.max(1, Math.round(secsPerCycle * 2 / 3));
  const restSecs = secsPerCycle - learnSecs;
  return { learnSecs, restSecs };
}
