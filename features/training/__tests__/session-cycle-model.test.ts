import {
  completedCyclesAtPosition,
  deriveSessionCycles,
  elapsedLearningSeconds,
} from '../session-cycle-model';

// BB-380: 스트레스 케어 구간(careSecs) 도입분의 파생 검증.
// 기준 사이클은 PRD FR-07의 학습 600 + 휴식 300 + 케어 300 = 20분.

describe('deriveSessionCycles', () => {
  it('careSecs를 사이클 길이에 포함한다 (FR-07 20분 사이클)', () => {
    const plan = deriveSessionCycles({ totalSeconds: 4800, learnSecs: 600, restSecs: 300, careSecs: 300 });
    expect(plan.secsPerCycle).toBe(1200);
    expect(plan.totalCycles).toBe(4);
    expect(plan.totalLearningSeconds).toBe(2400);
  });

  it('careSecs=0이면 기존 2구간 사이클과 동일하다', () => {
    const plan = deriveSessionCycles({ totalSeconds: 3600, learnSecs: 600, restSecs: 300, careSecs: 0 });
    expect(plan.secsPerCycle).toBe(900);
    expect(plan.totalCycles).toBe(4);
  });

  it('부분 사이클의 학습 초는 learnSecs를 넘지 않는다', () => {
    const plan = deriveSessionCycles({ totalSeconds: 1200 + 700, learnSecs: 600, restSecs: 300, careSecs: 300 });
    expect(plan.totalCycles).toBe(2);
    expect(plan.totalLearningSeconds).toBe(600 + 600);
  });
});

describe('elapsedLearningSeconds', () => {
  it('stress-care 구간에서는 해당 사이클의 학습분을 전부 적립한다', () => {
    expect(elapsedLearningSeconds(2, 'stress-care', 120, 600)).toBe(1200);
  });

  it('learning 구간에서는 경과분만 적립한다', () => {
    expect(elapsedLearningSeconds(2, 'learning', 150, 600)).toBe(750);
  });
});

describe('completedCyclesAtPosition', () => {
  it('care가 있으면 stress-care가 끝까지 지나야 사이클 완료다', () => {
    expect(completedCyclesAtPosition(1, 'stress-care', 300, 300, 300)).toBe(1);
    expect(completedCyclesAtPosition(1, 'stress-care', 299, 300, 300)).toBe(0);
    // rest가 끝나도 care가 남았으므로 아직 미완료
    expect(completedCyclesAtPosition(1, 'rest', 300, 300, 300)).toBe(0);
  });

  it('care가 없으면 기존처럼 rest 종료가 사이클 완료다', () => {
    expect(completedCyclesAtPosition(1, 'rest', 300, 300, 0)).toBe(1);
    expect(completedCyclesAtPosition(2, 'learning', 10, 300, 0)).toBe(1);
  });

  // 경계 스냅샷: care가 있는 세션에서 rest가 정확히 끝난 시점의 복구 기록은
  // 아직 care 구간이 남았으므로 사이클 완료로 세지 않는다.
  it('care가 있으면 rest 종료 경계 스냅샷도 미완료다', () => {
    expect(completedCyclesAtPosition(2, 'rest', 300, 300, 300)).toBe(1);
  });

  // 비정상 조합 방어: careSecs=0(구버전 기록)인데 stress-care phase가 오면 완료로 세지 않는다.
  it('careSecs=0에 stress-care phase가 오는 비정상 조합은 미완료 처리한다', () => {
    expect(completedCyclesAtPosition(1, 'stress-care', 300, 300, 0)).toBe(0);
  });
});
