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
import { FcmRegistrationBootstrap } from '@/components/app/fcm-registration-bootstrap';
import { RootNavigator } from '@/components/app/root-navigator';

export const unstable_settings = {
  anchor: '(onboarding)',
};

void SplashScreen.preventAutoHideAsync().catch((error: unknown) => {
  console.warn('[splash.preventAutoHide]', error);
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    'Pretendard-Regular': require('../assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Bold': require('../assets/fonts/Pretendard-Bold.otf'),
    'Pretendard-ExtraBold': require('../assets/fonts/Pretendard-ExtraBold.otf'),
    'Pretendard-Black': require('../assets/fonts/Pretendard-Black.otf'),
  });

  useEffect(() => {
    if (!fontsLoaded && !fontError) {
      return;
    }

    if (fontError) {
      console.warn('[fonts.load]', fontError);
    }

    void SplashScreen.hideAsync().catch((error: unknown) => {
      console.warn('[splash.hide]', error);
    });
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AppProviders>
      <AppOpenTracker />
      <FcmRegistrationBootstrap />
      <RootNavigator />
      <StatusBar style="dark" />
    </AppProviders>
  );
}
