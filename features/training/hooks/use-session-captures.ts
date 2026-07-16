import { useEffect, useState } from 'react';

import { reportError } from '@/features/analytics/error-reporter';

import { loadFollowAlongCaptures } from '../follow-along-capture-storage';
import type { FollowAlongCapture } from '../follow-along-capture-types';

// 특정 세션에서 캡처된 따라하기 녹음을 시각순으로 로드한다(디버그 화면 전용).
// 저장 상한(500MB)은 기기 전역 기준이라 세션 합계와 함께 전역 합계도 반환한다.
// captures: null = 로딩 중, [] = 캡처 없음. uri 는 스토어 load 단계에서 절대 경로로 hydrate 된 상태다.
export function useSessionCaptures(sessionId: string): {
  captures: FollowAlongCapture[] | null;
  totalBytes: number;
} {
  const [captures, setCaptures] = useState<FollowAlongCapture[] | null>(null);
  const [totalBytes, setTotalBytes] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    loadFollowAlongCaptures()
      .then((store) => {
        if (isCancelled) return;
        const all = Object.values(store.capturesById);
        const list = all
          .filter((capture) => capture.sessionId === sessionId)
          .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
        setCaptures(list);
        setTotalBytes(all.reduce((sum, capture) => sum + capture.sizeBytes, 0));
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

  return { captures, totalBytes };
}
