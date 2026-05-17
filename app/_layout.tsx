import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, AppState, type AppStateStatus, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { BuddyBirdColors } from '@/constants/theme';
import { AnalyticsProvider, useAnalytics } from '@/features/analytics/analytics-context';
import { I18nProvider } from '@/features/i18n/i18n-context';
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
      <GestureHandlerRootView style={styles.root}>
        <AnalyticsProvider>
          <I18nProvider>
            <ProfileProvider>
              <TrainingDataProvider>
                <WordLibraryProvider>
                  <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                    <AppOpenTracker />
                    <RootNavigator />
                    <StatusBar style="dark" />
                  </ThemeProvider>
                </WordLibraryProvider>
              </TrainingDataProvider>
            </ProfileProvider>
          </I18nProvider>
        </AnalyticsProvider>
      </GestureHandlerRootView>
  );
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
