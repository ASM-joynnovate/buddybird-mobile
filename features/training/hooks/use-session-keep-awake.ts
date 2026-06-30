import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';

const KEEP_AWAKE_TAG = 'training-session';

function warnKeepAwake(error: unknown): void {
  console.warn('[training.keepAwake]', error);
}

// 학습이 진행 중일 때만 화면 자동 꺼짐을 막는다.
// active=true 면 활성화, false 가 되거나 언마운트되면 해제.
// 활성화는 비동기라 해제보다 늦게 네이티브에 닿을 수 있다 → 활성화가 끝나기 전에
// 정리가 먼저 돌면 활성화 직후 다시 해제해, 학습이 끝났는데 lock 이 남지 않게 한다.
// 호출 실패는 학습을 멈추지 않도록 경고만 남긴다(non-fatal).
export function useSessionKeepAwake(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    let released = false;
    activateKeepAwakeAsync(KEEP_AWAKE_TAG)
      .then(() => {
        if (released) deactivateKeepAwake(KEEP_AWAKE_TAG).catch(warnKeepAwake);
      })
      .catch(warnKeepAwake);
    return () => {
      released = true;
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(warnKeepAwake);
    };
  }, [active]);
}
