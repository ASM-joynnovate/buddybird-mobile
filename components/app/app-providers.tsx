import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { FcmHeadlessGuard } from '@/components/app/fcm-headless-guard';
import { AnalyticsProvider } from '@/features/analytics/analytics-context';
import { I18nProvider } from '@/features/i18n/i18n-context';
import { ProfileProvider } from '@/features/profile/profile-context';
import { TrainingDataProvider } from '@/features/training/training-context';
import { WordLibraryProvider } from '@/features/word-library/word-library-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * 앱 전역 provider 스택의 단일 소유처. 이 중첩 순서는 런타임에만 강제되는
 * 암묵적 인터페이스이므로 한 곳에 모아 둔다.
 *
 * 순서 의존(보존 필수): `ProfileProvider`가 `useAnalytics()`를 읽으므로
 * `AnalyticsProvider`가 반드시 위(바깥)에 있어야 한다. 이 숨은 의존 자체의
 * 제거(analytics seam 역전)는 본 슬라이스 범위 밖이며, 여기서는 순서만 보존한다.
 *
 * `FcmHeadlessGuard`는 provider가 아닌 가드지만 트리 최외곽이므로 "순서를 한 곳에"
 * 원칙을 지키기 위해 함께 감싼다.
 */
export function AppProviders({ children }: { children: ReactNode }) {
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
                      {children}
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
