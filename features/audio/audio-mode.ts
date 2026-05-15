import { setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';
import { Platform } from 'react-native';

import { reportError } from '@/features/analytics/error-reporter';

export async function configureRecordingAudioMode(): Promise<void> {
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
  });
  await setIsAudioActiveAsync(true);
}

export async function configurePlaybackAudioMode(): Promise<void> {
  if (Platform.OS === 'ios') {
    // iOS는 mode 전환 전에 audio session을 한 번 비활성화해야 안정적으로 라우팅됨.
    // 이미 비활성 상태라 실패해도 후속 setAudioModeAsync로 복구 가능 → 로그만 남김.
    await setIsAudioActiveAsync(false).catch((error: unknown) => {
      reportError(error, { scope: 'audio.preDeactivate' });
    });
  }
  await setAudioModeAsync({
    allowsRecording: false,
    playsInSilentMode: true,
    shouldRouteThroughEarpiece: false,
  });
  await setIsAudioActiveAsync(true);
}
