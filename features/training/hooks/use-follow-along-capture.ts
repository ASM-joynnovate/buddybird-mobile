import { useFollowAlongVad } from '@/features/audio/hooks/use-follow-along-vad';
import { createCaptureId } from '@/features/shared/ids';

import { appendFollowAlongCapture } from '../follow-along-capture-storage';

interface UseFollowAlongCaptureInput {
  // 따라하기 무음 갭 동안에만 true (use-session-audio-player 의 inFollowGap).
  enabled: boolean;
  sessionId: string;
  wordId: string;
  cycle: number;
  // 갭 녹음 정지 + 재생 모드 복원 직후 호출 — 학습 루프의 재생 재개 트리거.
  onGapClosed?: () => void;
}

// 따라하기 갭 VAD 를 세션에 연결하는 얇은 배선 훅.
// 발화가 감지된 갭의 녹음이 저장되면 로컬 캡처 스토어에 append 한다(UI 노출 없음).
// 추후 백엔드 연결 시 flushPendingFollowAlongCaptures 로 전송한다.
export function useFollowAlongCapture({ enabled, sessionId, wordId, cycle, onGapClosed }: UseFollowAlongCaptureInput): void {
  useFollowAlongVad({
    enabled,
    onGapClosed,
    onSaved: (file, segments) => {
      if (!sessionId) return;
      void appendFollowAlongCapture({
        id: createCaptureId(),
        sessionId,
        wordId,
        cycle,
        capturedAt: new Date().toISOString(),
        uri: file.uri,
        fileName: file.fileName,
        segments,
        uploaded: false,
      });
    },
  });
}
