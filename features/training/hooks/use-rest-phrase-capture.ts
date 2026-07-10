import { useRestVad } from '@/features/audio/hooks/use-rest-vad';
import { createCaptureId } from '@/features/shared/ids';

import { appendFollowAlongCapture } from '../follow-along-capture-storage';

interface UseRestPhraseCaptureInput {
  // 휴식 phase 동안에만 true (use-active-session 의 status/phase 조합).
  enabled: boolean;
  sessionId: string;
  wordId: string;
  cycle: number;
}

// 휴식 구간 VAD 를 세션에 연결하는 얇은 배선 훅.
// 발화 1건이 파일로 확정될 때마다 로컬 캡처 스토어에 append 한다(UI 노출 없음).
// 따라하기 갭 캡처와 같은 스토어를 쓰며 phase 로만 구분된다.
export function useRestPhraseCapture({ enabled, sessionId, wordId, cycle }: UseRestPhraseCaptureInput): void {
  useRestVad({
    enabled,
    onSaved: (file, segments) => {
      if (!sessionId) return;
      void appendFollowAlongCapture({
        id: createCaptureId(),
        sessionId,
        wordId,
        cycle,
        phase: 'rest',
        capturedAt: new Date().toISOString(),
        uri: file.uri,
        fileName: file.fileName,
        segments,
        uploaded: false,
      });
    },
  });
}
