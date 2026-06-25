// 세션 라이프사이클 상태머신: idle → running/paused → rest → cycle 증가 → completed.
// 전이를 순수 reducer 한 곳에 모은다 (React API·타이머·부수효과 미사용).
// 전이 판정용 불변 파라미터(learnSecs/restSecs/totalCycles)는 #04 deriveSessionCycles
// 결과를 초기화 시 주입해 state에 둔다 → reducer(state, action)이 타이머 없이 자기완결적.

import type { SessionStatus } from './session-config';

/** 한 phase가 진행을 멈추는 dispatch 간격(ms). hook의 setInterval이 사용. */
export const TICK_INTERVAL_MS = 1000;
/** phase 완료 도달 후 다음 phase로 넘어가기까지의 딜레이(ms). hook의 setTimeout이 사용. */
export const PHASE_ADVANCE_DELAY_MS = 980;

export interface SessionState {
  status: SessionStatus;
  phase: 'learning' | 'rest';
  cycle: number;
  phaseElapsed: number;
  // 전이 판정용 불변 파라미터 (초기화 시 #04 결과로 주입)
  learnSecs: number;
  restSecs: number;
  totalCycles: number;
}

export type SessionAction =
  | { type: 'tick' } // running일 때만 phaseElapsed += 1 (phase 길이 cap)
  | { type: 'togglePause' } // running↔paused
  | { type: 'advancePhase' } // phaseElapsed가 phase 길이에 도달한 뒤 hook이 dispatch
  | { type: 'reset' }; // → idle (stop/dismissCompletion 공용)

export interface SessionParams {
  learnSecs: number;
  restSecs: number;
  totalCycles: number;
}

export function createInitialSessionState({ learnSecs, restSecs, totalCycles }: SessionParams): SessionState {
  return {
    status: 'running',
    phase: 'learning',
    cycle: 1,
    phaseElapsed: 0,
    learnSecs,
    restSecs,
    totalCycles,
  };
}

function phaseDurationOf(state: SessionState): number {
  return state.phase === 'learning' ? state.learnSecs : state.restSecs;
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'tick': {
      if (state.status !== 'running') return state;
      return { ...state, phaseElapsed: Math.min(state.phaseElapsed + 1, phaseDurationOf(state)) };
    }
    case 'togglePause': {
      if (state.status === 'running') return { ...state, status: 'paused' };
      if (state.status === 'paused') return { ...state, status: 'running' };
      return state;
    }
    case 'advancePhase': {
      if (state.status !== 'running') return state;
      if (state.phase === 'learning') {
        return { ...state, phase: 'rest', phaseElapsed: 0 };
      }
      if (state.cycle >= state.totalCycles) {
        return { ...state, status: 'completed', cycle: 1, phase: 'learning', phaseElapsed: 0 };
      }
      return { ...state, cycle: state.cycle + 1, phase: 'learning', phaseElapsed: 0 };
    }
    case 'reset': {
      return { ...state, status: 'idle' };
    }
  }
}
