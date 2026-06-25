import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import {
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AppOpenTracker } from '@/components/app/app-open-tracker';
import { AppProviders } from '@/components/app/app-providers';
import { AppSplashGate } from '@/components/app/app-splash-gate';
import { FcmRegistrationBootstrap } from '@/components/app/fcm-registration-bootstrap';
import { RootNavigator } from '@/components/app/root-navigator';

export const unstable_settings = {
  anchor: '(onboarding)',
};

void SplashScreen.preventAutoHideAsync().catch((error: unknown) => {
  console.warn('[splash.preventAutoHide]', error);
});

export default function RootLayout() {
  // 폰트는 로드하되 트리를 막지 않는다 — AppSplashGate 오버레이가 즉시 떠서 네이티브(텍스트)
  // 스플래시를 onLayout 에서 곧장 hideAsync 로 인계, 노출 시간을 최소화. 준비 전 화면은 오버레이가 가림.
  const [, fontError] = useFonts({
    Fredoka_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    'Pretendard-Regular': require('../assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Bold': require('../assets/fonts/Pretendard-Bold.otf'),
    'Pretendard-ExtraBold': require('../assets/fonts/Pretendard-ExtraBold.otf'),
    'Pretendard-Black': require('../assets/fonts/Pretendard-Black.otf'),
  });

  useEffect(() => {
    if (fontError) {
      console.warn('[fonts.load]', fontError);
    }
  }, [fontError]);

  return (
    <AppProviders>
      <AppOpenTracker />
      <FcmRegistrationBootstrap />
      <RootNavigator />
      <AppSplashGate />
      <StatusBar style="dark" />
    </AppProviders>
  );
}
