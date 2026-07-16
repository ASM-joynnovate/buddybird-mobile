import type { TrainingAudioSourceType } from './training-types';
import type { SessionEngineState } from '@/modules/session-audio-engine';


// 카피(라벨·설명)는 UI 가 `sessionSetup.presets.<key>.*` 리소스로 해석한다.
export const SESSION_PRESETS = [
  { key: 'short', learnSecs: 600, restSecs: 300, cycles: 2 },
  { key: 'medium', learnSecs: 600, restSecs: 300, cycles: 4 },
  { key: 'long', learnSecs: 600, restSecs: 300, cycles: 12 },
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
