import { useEffect } from 'react';

import { useAnalytics } from '../analytics-context';

/**
 * 마운트 동안 세션 리플레이(Clarity 화면 캡처)를 중단한다. 세션 화면은 상시
 * 애니메이션으로 캡처·직렬화가 반복돼 힙 소진 OOM 크래시를 유발한다 (BB-276).
 * focus 가 아닌 mount 기준 — 위에 다른 화면(session-captures)이 쌓여도 세션
 * 화면이 살아있는 동안은 캡처를 재개하지 않는다.
 *
 * 제약: pause 상태는 refcount 가 아닌 단일 boolean 이라 이 훅을 쓰는 화면이
 * 동시에 두 개 마운트되면 위 화면의 unmount 가 아래 화면의 pause 를 풀어버린다.
 * 두 번째 소비처 추가 시 refcount 전환이 선행되어야 한다.
 */
export function useSessionReplayPause(): void {
  const { pauseSessionReplay, resumeSessionReplay } = useAnalytics();

  useEffect(() => {
    pauseSessionReplay();

    return () => {
      resumeSessionReplay();
    };
  }, [pauseSessionReplay, resumeSessionReplay]);
}
