// toFirebaseParams 의 숫자 방어만 다룬다 — 기존 직렬화 동작의 소급 커버는 범위 밖 (docs/TESTING.md §2).

import { toFirebaseParams } from '../events';

describe('toFirebaseParams', () => {
  // 손상된 레코드의 capturedAt 은 '' 로 살아남고(follow-along-capture-storage), 경과 시간 계산이
  // NaN 이 된다. 그대로 나가면 업로드 성공률 지표가 조용히 오염되므로 키째 빠져야 한다.
  it('drops non-finite numbers instead of forwarding them', () => {
    expect(toFirebaseParams({ latency_ms: NaN, batch_size: 3 })).toEqual({ batch_size: 3 });
    expect(toFirebaseParams({ age_ms: Infinity })).toEqual({});
    expect(toFirebaseParams({ age_ms: -Infinity })).toEqual({});
  });

  it('keeps finite numbers including zero and negatives', () => {
    expect(toFirebaseParams({ latency_ms: 0, drift_ms: -5, count: 12 })).toEqual({
      latency_ms: 0,
      drift_ms: -5,
      count: 12,
    });
  });
});
