// 세션 성능 저하 판정·스로틀 규칙 (BB-285, PRD-0001 NFR-01). 순수 함수 — I/O 없음.
// 기준치·스로틀 수치는 잠정값 — 출시 후 실측으로 확정한다 (NFR-01). JS 상수라 재빌드 없이 튜닝 가능.

export type SessionPerfKind = 'audio_delay' | 'ui_lag';

export const SESSION_PERF_THRESHOLDS = {
  // audio_delay: 의도 시각이 스케줄 실행 시점이라 위상 타이머 지연(~250ms)은 측정에서 제외됨 —
  // 준비된 소스의 재생 재시작 통상 지연(수십 ms)의 4~5배 여유.
  audioDelayMs: 200,
  // ui_lag: 길이 S인 멈춤을 기준치 T로 보장 검출하려면 S ≥ T + 주기 — T=200ms·주기 100ms여야
  // 업로드 zipSync 실측 점유(~300ms)부터 보장 검출된다.
  uiLagMs: 200,
  tickIntervalMs: 100,
  /** kind별 최소 발행 간격 — 저하 지속 시 틱마다 발행되는 폭주 방지 */
  minEventGapMs: 5_000,
  /** kind별 세션당 발행 상한 — 긴 세션의 무제한 누적 방지 (정확히 상한 도달 = 포화 의심 신호) */
  maxEventsPerSession: 20,
} as const;

/** interval 예상 tick 시각 대비 실제 시각의 지연. 조기 tick(음수)은 0으로 클램프. */
export function computeTickDriftMs(expectedAtMs: number, actualAtMs: number): number {
  return Math.max(0, actualAtMs - expectedAtMs);
}

/** 기준치 초과 판정 — "지연이 기준치를 넘으면" (티켓 계약) 이므로 초과만 참, 동률은 거짓. */
export function isDegraded(kind: SessionPerfKind, valueMs: number): boolean {
  const threshold = kind === 'audio_delay' ? SESSION_PERF_THRESHOLDS.audioDelayMs : SESSION_PERF_THRESHOLDS.uiLagMs;
  return valueMs > threshold;
}

/** 네이티브 스냅샷의 audio_delay 필드 값 — "값 없음"은 Android `null`·iOS 키 생략(`undefined`) 둘 다. */
export type ObservedDelayMs = number | null | undefined;

/**
 * audio_delay 스냅샷 관측 1회 판정 — 값 전이일 때만 확정 지연으로 본다 (재생 1회당 1판정).
 * `null`/`undefined`는 동일하게 "값 없음"으로 취급한다.
 * 전제: 네이티브가 스케줄마다 필드를 값 없음으로 리셋한 스냅샷이 먼저 관측된다 —
 * 이 리셋 스냅샷이 누락되면 연속 두 재생의 지연이 같은 ms일 때 두 번째 판정이 사라진다.
 */
export function observeAudioDelay(
  lastObserved: ObservedDelayMs,
  observed: ObservedDelayMs,
): { nextObserved: ObservedDelayMs; confirmedDelayMs: number | null } {
  if (observed === lastObserved) return { nextObserved: lastObserved, confirmedDelayMs: null };
  return { nextObserved: observed, confirmedDelayMs: observed ?? null };
}

interface KindThrottleEntry {
  readonly count: number;
  readonly lastEmitAtMs: number | null;
}

export interface SessionPerfThrottleState {
  readonly byKind: Readonly<Record<SessionPerfKind, KindThrottleEntry>>;
}

export function createThrottleState(): SessionPerfThrottleState {
  return {
    byKind: {
      audio_delay: { count: 0, lastEmitAtMs: null },
      ui_lag: { count: 0, lastEmitAtMs: null },
    },
  };
}

/** 발행 허용 판정 + 다음 스로틀 상태. mutate 없음 — 허용 시에만 새 상태를 반환한다. */
export function shouldEmit(
  state: SessionPerfThrottleState,
  kind: SessionPerfKind,
  nowMs: number,
): { emit: boolean; next: SessionPerfThrottleState } {
  const entry = state.byKind[kind];
  if (entry.count >= SESSION_PERF_THRESHOLDS.maxEventsPerSession) return { emit: false, next: state };
  if (entry.lastEmitAtMs !== null && nowMs - entry.lastEmitAtMs < SESSION_PERF_THRESHOLDS.minEventGapMs) {
    return { emit: false, next: state };
  }
  return {
    emit: true,
    next: {
      byKind: { ...state.byKind, [kind]: { count: entry.count + 1, lastEmitAtMs: nowMs } },
    },
  };
}
