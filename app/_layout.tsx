import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  AppState,
  Platform,
  type AppStateStatus,
  StyleSheet,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { BuddyBirdColors } from '@/constants/theme';
import { AnalyticsProvider, useAnalytics } from '@/features/analytics/analytics-context';
import { I18nProvider } from '@/features/i18n/i18n-context';
import { getFcmHeadlessLaunchStatus } from '@/features/notifications/fcm-client';
import { useFcmRegistration } from '@/features/notifications/hooks/use-fcm-registration';
import { ProfileProvider, useProfile } from '@/features/profile/profile-context';
import { TrainingDataProvider } from '@/features/training/training-context';
import { WordLibraryProvider } from '@/features/word-library/word-library-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(onboarding)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <FcmHeadlessGuard>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <AnalyticsProvider>
            <I18nProvider>
              <ProfileProvider>
                <TrainingDataProvider>
                  <WordLibraryProvider>
                    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                      <AppOpenTracker />
                      <FcmRegistrationBootstrap />
                      <RootNavigator />
                      <StatusBar style="dark" />
                    </ThemeProvider>
                  </WordLibraryProvider>
                </TrainingDataProvider>
              </ProfileProvider>
            </I18nProvider>
          </AnalyticsProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </FcmHeadlessGuard>
  );
}

function FcmHeadlessGuard({ children }: { children: ReactNode }) {
  const [isHeadless, setIsHeadless] = useState<boolean | null>(
    Platform.OS === 'ios' ? null : false
  );

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return undefined;
    }

    let isMounted = true;

    async function checkHeadlessLaunch(): Promise<void> {
      try {
        const nextIsHeadless = await getFcmHeadlessLaunchStatus();
        if (isMounted) {
          setIsHeadless(nextIsHeadless);
        }
      } catch (error: unknown) {
        console.warn('[notifications.headlessCheck]', error);
        if (isMounted) {
          setIsHeadless(false);
        }
      }
    }

    void checkHeadlessLaunch();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isHeadless !== false) {
    return null;
  }

  return children;
}

function AppOpenTracker() {
  const { isReady, track } = useAnalytics();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const foregroundedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!isReady) return;

    track({ name: 'app_open', params: { cold_start: true } });
    foregroundedAtRef.current = Date.now();

    const subscription = AppState.addEventListener('change', (nextState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (prevState.match(/inactive|background/) && nextState === 'active') {
        foregroundedAtRef.current = Date.now();
        track({ name: 'app_foreground', params: {} });
        return;
      }

      if (prevState === 'active' && nextState.match(/inactive|background/)) {
        const sessionDurationMs = Date.now() - foregroundedAtRef.current;
        track({
          name: 'app_background',
          params: { session_duration_ms: sessionDurationMs },
        });
      }
    });

    return () => subscription.remove();
  }, [isReady, track]);

  return null;
}

function FcmRegistrationBootstrap() {
  const { profile } = useProfile();

  useFcmRegistration({ enabled: !!profile });

  return null;
}

function RootNavigator() {
  const { isHydrated, profile } = useProfile();

  if (!isHydrated) {
    return (
        <View style={styles.loadingScreen}>
          <ActivityIndicator color={BuddyBirdColors.secondary} />
        </View>
    );
  }

  return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!!profile}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
              name="session-active"
              options={{
                headerShown: false,
                animation: 'fade',
                animationDuration: 220,
                contentStyle: { backgroundColor: BuddyBirdColors.darkBg },
                navigationBarColor: BuddyBirdColors.darkBg,
              }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!profile}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
      </Stack>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.neutral,
    flex: 1,
    justifyContent: 'center',
  },
});
