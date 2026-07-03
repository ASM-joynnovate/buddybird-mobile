import { useEffect, useState } from 'react';

import { reportError } from '@/features/analytics/error-reporter';

import { loadFollowAlongCaptures } from '../follow-along-capture-storage';
import type { FollowAlongCapture } from '../follow-along-capture-types';

// 특정 세션에서 캡처된 따라하기 녹음을 시각순으로 로드한다(디버그 화면 전용).
// null = 로딩 중, [] = 캡처 없음. uri 는 스토어 load 단계에서 절대 경로로 hydrate 된 상태다.
export function useSessionCaptures(sessionId: string): FollowAlongCapture[] | null {
  const [captures, setCaptures] = useState<FollowAlongCapture[] | null>(null);

  useEffect(() => {
    let isCancelled = false;

    loadFollowAlongCaptures()
      .then((store) => {
        if (isCancelled) return;
        const list = Object.values(store.capturesById)
          .filter((capture) => capture.sessionId === sessionId)
          .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
        setCaptures(list);
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        reportError(error, { scope: 'training.useSessionCaptures' });
        setCaptures([]);
      });

    return () => {
      isCancelled = true;
    };
  }, [sessionId]);

  return captures;
}
