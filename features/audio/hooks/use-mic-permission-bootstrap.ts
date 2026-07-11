import { AudioModule, PermissionStatus } from 'expo-audio';
import { useEffect } from 'react';
import { Platform } from 'react-native';

// 앱 최초 실행 시 마이크 권한을 선요청한다. OS가 아직 묻지 않은(undetermined) 상태일 때만
// 요청하므로 시스템 다이얼로그는 설치 후 1회만 뜨고, 이미 허용/거부된 뒤에는 재요청하지 않는다.
// 실제 녹음/VAD 시작 지점의 lazy 요청은 그대로 두어, 여기서 거부됐어도 이후 흐름이 재요청한다.
export function useMicPermissionBootstrap(): void {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    let isMounted = true;

    async function requestIfUndetermined(): Promise<void> {
      try {
        const current = await AudioModule.getRecordingPermissionsAsync();
        if (!isMounted || current.status !== PermissionStatus.UNDETERMINED) return;
        await AudioModule.requestRecordingPermissionsAsync();
      } catch (error: unknown) {
        console.warn('[audio.micPermissionBootstrap]', error);
      }
    }

    void requestIfUndetermined();

    return () => {
      isMounted = false;
    };
  }, []);
}
