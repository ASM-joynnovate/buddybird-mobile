import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { FcmHeadlessGuard } from '@/components/app/fcm-headless-guard';
import { AnalyticsProvider } from '@/features/analytics/analytics-context';
import { AuthProvider } from '@/features/auth/auth-context';
import { FeedbackProvider } from '@/features/feedback/feedback-context';
import { I18nProvider } from '@/features/i18n/i18n-context';
import { ProfileProvider } from '@/features/profile/profile-context';
import { TrainingDataProvider } from '@/features/training/training-context';
import { WordLibraryProvider } from '@/features/word-library/word-library-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * 앱 전역 provider 스택의 단일 소유처. 이 중첩 순서는 런타임에만 강제되는
 * 암묵적 인터페이스이므로 한 곳에 모아 둔다.
 *
 * 순서 의존(권장): `AnalyticsProvider`는 `AuthProvider`의 uid를 구독하고,
 * `ProfileProvider`는 `AnalyticsProvider`에 user property를 동기화한다. `FeedbackProvider`는
 * analytics와 i18n을 사용한다. provider 간 의존이 모두 충족되도록 이 순서를 유지한다.
 *
 * `FcmHeadlessGuard`는 provider가 아닌 가드지만 트리 최외곽이므로 "순서를 한 곳에"
 * 원칙을 지키기 위해 함께 감싼다.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();

  return (
    <FcmHeadlessGuard>
      <GestureHandlerRootView style={styles.root}>
        <KeyboardProvider navigationBarTranslucent statusBarTranslucent>
          <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <AuthProvider>
              <AnalyticsProvider>
                <I18nProvider>
                  <ProfileProvider>
                    <TrainingDataProvider>
                      <WordLibraryProvider>
                        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                          <FeedbackProvider>{children}</FeedbackProvider>
                        </ThemeProvider>
                      </WordLibraryProvider>
                    </TrainingDataProvider>
                  </ProfileProvider>
                </I18nProvider>
              </AnalyticsProvider>
            </AuthProvider>
          </SafeAreaProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </FcmHeadlessGuard>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
