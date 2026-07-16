import { useLocalSearchParams, useRouter } from 'expo-router';

import { SessionCapturesView } from '@/components/debug/session-captures-view';
import { useCapturePlayback } from '@/features/audio/hooks/use-capture-playback';
import { useSessionCaptures } from '@/features/training/hooks/use-session-captures';

// 학습 종료 화면에서 숨은 진입(5탭)으로 열리는 개발자 디버그 화면.
// 방금 끝난 세션의 VAD 캡처 녹음을 나열·재생해 분할이 제대로 됐는지 확인한다.
export default function SessionCapturesScreen() {
  const router = useRouter();
  const { sessionId, word } = useLocalSearchParams<{ sessionId: string; word?: string }>();
  const { captures, totalBytes } = useSessionCaptures(sessionId ?? '');
  const playback = useCapturePlayback();

  return (
    <SessionCapturesView
      word={word ?? ''}
      captures={captures}
      totalBytes={totalBytes}
      playback={playback}
      onClose={() => router.back()}
    />
  );
}
