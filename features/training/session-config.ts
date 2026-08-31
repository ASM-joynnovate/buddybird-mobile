import type { TrainingAudioSourceType } from './training-types';
import type { SessionEngineState } from '@/modules/session-audio-engine';


// 스트레스 케어 구간 길이 (BB-380, PRD FR-07: 사이클당 5분 고정).
export const STRESS_CARE_SECONDS = 300;

// 카피(라벨·설명)는 UI 가 `sessionSetup.presets.<key>.*` 리소스로 해석한다.
// 프리셋 사이클 = 학습 10분 + 휴식 5분 + 스트레스 케어 5분 (PRD FR-07의 20분 사이클).
export const SESSION_PRESETS = [
  { key: 'short', learnSecs: 600, restSecs: 300, careSecs: STRESS_CARE_SECONDS, cycles: 2 },
  { key: 'medium', learnSecs: 600, restSecs: 300, careSecs: STRESS_CARE_SECONDS, cycles: 4 },
  { key: 'long', learnSecs: 600, restSecs: 300, careSecs: STRESS_CARE_SECONDS, cycles: 12 },
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

export function calcCycleSecsFromTotal(totalSecs: number): { learnSecs: number; restSecs: number; careSecs: number } {
  if (totalSecs <= 0) return { learnSecs: 0, restSecs: 0, careSecs: 0 };
  const n = Math.max(1, Math.round(totalSecs / 1200));
  const secsPerCycle = Math.round(totalSecs / n);
  // 스트레스 케어는 사이클의 1/4를 넘지 않는 선에서 5분을 목표로 한다 (짧은 custom 세션 대비).
  const careSecs = Math.min(STRESS_CARE_SECONDS, Math.floor(secsPerCycle / 4));
  const base = secsPerCycle - careSecs;
  const rawLearn = Math.max(60, Math.round((base * 2) / 3 / 60) * 60);
  const rawRest = Math.max(60, base - rawLearn);

  if (rawLearn + rawRest <= base) {
    return { learnSecs: rawLearn, restSecs: rawRest, careSecs };
  }

  // 최솟값 강제로 base 초과 시 → 2:1 비율로 축소 (분 반올림 없음)
  const learnSecs = Math.max(1, Math.round(base * 2 / 3));
  const restSecs = base - learnSecs;
  return { learnSecs, restSecs, careSecs };
}
