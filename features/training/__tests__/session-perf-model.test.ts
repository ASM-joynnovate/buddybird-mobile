import {
  computeTickDriftMs,
  createThrottleState,
  isDegraded,
  SESSION_PERF_THRESHOLDS,
  shouldEmit,
} from '../session-perf-model';

describe('computeTickDriftMs', () => {
  it.each([
    [1_000, 1_000, 0],
    [1_000, 1_150, 150],
    // 조기 tick(타이머가 예상보다 먼저 발화)은 음수 — 0으로 클램프
    [1_000, 990, 0],
  ])('expected=%d actual=%d → %d', (expectedAtMs, actualAtMs, expected) => {
    expect(computeTickDriftMs(expectedAtMs, actualAtMs)).toBe(expected);
  });
});

describe('isDegraded', () => {
  // "기준치를 넘으면" 계약 — 동률은 저하 아님, 초과만 저하.
  it.each([
    ['audio_delay', SESSION_PERF_THRESHOLDS.audioDelayMs - 1, false],
    ['audio_delay', SESSION_PERF_THRESHOLDS.audioDelayMs, false],
    ['audio_delay', SESSION_PERF_THRESHOLDS.audioDelayMs + 1, true],
    ['ui_lag', SESSION_PERF_THRESHOLDS.uiLagMs - 1, false],
    ['ui_lag', SESSION_PERF_THRESHOLDS.uiLagMs, false],
    ['ui_lag', SESSION_PERF_THRESHOLDS.uiLagMs + 1, true],
  ] as const)('kind=%s value=%d → %s', (kind, valueMs, expected) => {
    expect(isDegraded(kind, valueMs)).toBe(expected);
  });
});

describe('shouldEmit', () => {
  const GAP = SESSION_PERF_THRESHOLDS.minEventGapMs;
  const MAX = SESSION_PERF_THRESHOLDS.maxEventsPerSession;

  it('첫 발행은 허용하고 카운트·시각을 기록한다', () => {
    const { emit, next } = shouldEmit(createThrottleState(), 'ui_lag', 10_000);
    expect(emit).toBe(true);
    expect(next.byKind.ui_lag).toEqual({ count: 1, lastEmitAtMs: 10_000 });
  });

  it('최소 간격 내 재발행은 차단하고 상태를 바꾸지 않는다', () => {
    const first = shouldEmit(createThrottleState(), 'ui_lag', 10_000).next;
    const { emit, next } = shouldEmit(first, 'ui_lag', 10_000 + GAP - 1);
    expect(emit).toBe(false);
    expect(next).toBe(first);
  });

  it('최소 간격 경과(동률 포함) 시 재발행을 허용한다', () => {
    const first = shouldEmit(createThrottleState(), 'ui_lag', 10_000).next;
    expect(shouldEmit(first, 'ui_lag', 10_000 + GAP).emit).toBe(true);
  });

  it('세션당 상한 도달 후에는 간격이 지나도 영구 차단한다', () => {
    let state = createThrottleState();
    for (let i = 0; i < MAX; i += 1) {
      const result = shouldEmit(state, 'ui_lag', i * GAP);
      expect(result.emit).toBe(true);
      state = result.next;
    }
    expect(state.byKind.ui_lag.count).toBe(MAX);
    expect(shouldEmit(state, 'ui_lag', MAX * GAP * 2).emit).toBe(false);
  });

  it('kind별 카운터·간격이 독립이다', () => {
    const afterUiLag = shouldEmit(createThrottleState(), 'ui_lag', 10_000).next;
    // ui_lag 발행 직후여도 audio_delay는 간격 제약 없이 허용
    const { emit, next } = shouldEmit(afterUiLag, 'audio_delay', 10_001);
    expect(emit).toBe(true);
    expect(next.byKind.audio_delay.count).toBe(1);
    expect(next.byKind.ui_lag.count).toBe(1);
  });
});
