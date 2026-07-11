import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AppOpenTracker } from '@/components/app/app-open-tracker';
import { AppProviders } from '@/components/app/app-providers';
import { AppSplashGate } from '@/components/app/app-splash-gate';
import { AppUpdateGate } from '@/components/app/app-update-gate';
import { FcmRegistrationBootstrap } from '@/components/app/fcm-registration-bootstrap';
import { MicPermissionBootstrap } from '@/components/app/mic-permission-bootstrap';
import { RootNavigator } from '@/components/app/root-navigator';

export const unstable_settings = {
  anchor: '(onboarding)',
};

void SplashScreen.preventAutoHideAsync().catch((error: unknown) => {
  console.warn('[splash.preventAutoHide]', error);
});

// 폰트는 expo-font config plugin (app.config.ts) 이 네이티브에 임베드한다 — iOS UIAppFonts,
// Android assets/fonts. 앱 첫 프레임부터 OS 가 알고 있으므로 런타임 useFonts 로드는 불필요하다.
export default function RootLayout() {
  return (
    <AppProviders>
      <AppOpenTracker />
      <FcmRegistrationBootstrap />
      <MicPermissionBootstrap />
      <AppUpdateGate />
      <RootNavigator />
      <AppSplashGate />
      <StatusBar style="dark" />
    </AppProviders>
  );
}
