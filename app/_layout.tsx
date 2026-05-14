import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { PetHubColors } from '@/constants/theme';
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
    <I18nProvider>
      <ProfileProvider>
        <TrainingDataProvider>
          <WordLibraryProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <RootNavigator />
              <StatusBar style="dark" />
            </ThemeProvider>
          </WordLibraryProvider>
        </TrainingDataProvider>
      </ProfileProvider>
    </I18nProvider>
  );
}

function RootNavigator() {
  const { isHydrated, profile } = useProfile();

  if (!isHydrated) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={PetHubColors.secondary} />
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
            contentStyle: { backgroundColor: PetHubColors.darkBg },
            navigationBarColor: PetHubColors.darkBg,
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
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: PetHubColors.neutral,
    flex: 1,
    justifyContent: 'center',
  },
});
