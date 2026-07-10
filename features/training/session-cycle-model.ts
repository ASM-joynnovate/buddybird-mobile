// 세션 cycle 파생: learn/rest 한 사이클 길이와 총 사이클 수, 그로부터 나오는
// 총 세션 초·총 학습 초·세션 분을 한 곳에서 산출하는 순수 함수 모듈.
// 호출부(use-active-session / use-learning-setup / cycle-summary / session-active)는
// 인라인 공식을 두지 않고 이 모듈을 경유한다.

export interface SessionCycleInput {
  /** 세션 총 길이(초). 분 단위 호출부는 `mins * 60`을 넘긴다. */
  totalSeconds: number;
  learnSecs: number;
  restSecs: number;
}

export interface SessionCyclePlan {
  /** 한 사이클 = 학습 + 휴식 (초) */
  secsPerCycle: number;
  /** 총 사이클 수 (최소 1, secsPerCycle<=0이면 1) */
  totalCycles: number;
  /** 사이클로 환산한 총 세션 초 (최소 1) */
  totalSessionSeconds: number;
  /** 사이클로 환산한 총 학습 초 */
  totalLearningSeconds: number;
  /** 사이클로 환산한 세션 분 (반올림) */
  sessionMins: number;
}

export function deriveSessionCycles({ totalSeconds, learnSecs, restSecs }: SessionCycleInput): SessionCyclePlan {
  const secsPerCycle = learnSecs + restSecs;
  const totalCycles = secsPerCycle > 0 ? Math.max(1, Math.floor(totalSeconds / secsPerCycle)) : 1;

  return {
    secsPerCycle,
    totalCycles,
    totalSessionSeconds: Math.max(1, totalCycles * secsPerCycle),
    totalLearningSeconds: sessionLearningSeconds(totalCycles, learnSecs),
    sessionMins: Math.round((totalCycles * secsPerCycle) / 60),
  };
}

/** 사이클 수 × 학습 초 = 총 학습 초. 진행 화면·완료 저장이 공유한다. */
export function sessionLearningSeconds(totalCycles: number, learnSecs: number): number {
  return totalCycles * learnSecs;
}

/** 중단해도 연속 학습일·총 학습 시간에 반영되는 최소 세션 경과 초(5분). 판정은 세션 경과(일시정지 제외, 휴식 포함) 기준. */
export const STREAK_QUALIFYING_SECONDS = 300;

/**
 * 중단 시점까지 실제 진행한 학습 phase 초. 완료된 cycle들의 학습분에,
 * 현재 cycle이 학습 중이면 그 경과분을 더한다(휴식·일시정지 제외).
 * 총 학습 시간에 적립되는 값 = 완료 세션의 `sessionLearningSeconds`를 부분값으로 환산한 것.
 */
export function elapsedLearningSeconds(cycle: number, phase: 'learning' | 'rest', phaseElapsed: number, learnSecs: number): number {
  const completedLearning = Math.max(0, cycle - 1) * learnSecs;
  const currentLearning = phase === 'learning' ? Math.min(phaseElapsed, learnSecs) : learnSecs;
  return completedLearning + currentLearning;
}

export function cycleProgressPercent(cycle: number, totalCycles: number): number {
  return totalCycles > 0 ? Math.round((cycle / totalCycles) * 100) : 0;
}
