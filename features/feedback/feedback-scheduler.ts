import type { PromptSchedulerState } from './feedback-types';

/**
 * 접속일 누적 임계값 시퀀스. 이 값에 도달하면 피드백 팝업이 뜨고, 반응할 때마다 다음 값으로
 * 전진한다. 마지막 값(10)에서 고정되어 이후로는 10일마다 반복된다.
 */
export const THRESHOLDS = [3, 5, 7, 10] as const;

export function createInitialSchedulerState(): PromptSchedulerState {
  return { version: 1, lastCountedDate: null, dayCount: 0, thresholdIndex: 0 };
}

/**
 * 오늘이 새 접속일이면 dayCount 를 1 올리고 lastCountedDate 를 갱신한다. 같은 날 재실행이면
 * 상태를 바꾸지 않고 원본 참조를 그대로 반환한다(하루 여러 번 = 1회).
 */
export function registerActiveDay(state: PromptSchedulerState, todayKey: string): PromptSchedulerState {
  if (state.lastCountedDate === todayKey) {
    return state;
  }
  return { ...state, lastCountedDate: todayKey, dayCount: state.dayCount + 1 };
}

/** 현재 전진 단계의 임계값. thresholdIndex 가 범위를 벗어나도 마지막 값으로 안전하게 고정. */
export function currentThreshold(state: PromptSchedulerState): number {
  const index = Math.min(Math.max(state.thresholdIndex, 0), THRESHOLDS.length - 1);
  return THRESHOLDS[index];
}

export function shouldPrompt(state: PromptSchedulerState): boolean {
  return state.dayCount >= currentThreshold(state);
}

/**
 * 팝업에 반응(닫기 또는 제출 성공)한 뒤의 상태 전이: 카운트를 0으로 리셋하고 다음 임계값으로
 * 전진한다. 마지막 인덱스에서는 더 나아가지 않고 고정된다.
 */
export function advanceAfterResponse(state: PromptSchedulerState): PromptSchedulerState {
  return {
    ...state,
    dayCount: 0,
    thresholdIndex: Math.min(state.thresholdIndex + 1, THRESHOLDS.length - 1),
  };
}
