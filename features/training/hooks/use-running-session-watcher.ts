import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { reportError } from '@/features/analytics/error-reporter';
import { sessionAudioEngine, type SessionEngineSnapshot } from '@/modules/session-audio-engine';

import type { SessionStatus } from '../session-config';

// 세션이 아직 오디오 자원이나 서비스를 붙들고 있는 상태 — 이때만 배너를 띄운다.
const LIVE_STATUSES: SessionStatus[] = ['starting', 'running', 'paused', 'interrupted'];

// 진행 중인 네이티브 세션을 읽기만 하는 훅.
//
// useActiveSession 은 start()를 소유하고 자기 sessionId 로 스냅샷을 걸러내므로 학습 화면
// 바깥에서는 쓸 수 없다(두 번 마운트하면 세션을 또 시작한다). 이 훅은 명령을 보내지 않고
// 구독만 하므로 어디서든 안전하게 마운트된다.
export function useRunningSessionSnapshot(): SessionEngineSnapshot | null {
  const [snapshot, setSnapshot] = useState<SessionEngineSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;

    function accept(next: SessionEngineSnapshot | null): void {
      if (cancelled) return;
      setSnapshot(next && LIVE_STATUSES.includes(next.state) ? next : null);
    }

    function sync(): void {
      sessionAudioEngine
        .getSnapshot()
        .then(accept)
        .catch((error: unknown) => {
          reportError(error, { scope: 'training.runningSessionWatcher' });
        });
    }

    sync();
    const unsubscribers = [
      sessionAudioEngine.onStateChanged(accept),
      sessionAudioEngine.onProgress(accept),
    ];
    // 네이티브 주도 종료(알림 "종료")는 이벤트를 보내지 않는다 — 복귀할 때 다시 읽어야 사라진다.
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') sync();
    });

    return () => {
      cancelled = true;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      appStateSubscription.remove();
    };
  }, []);

  return snapshot;
}
