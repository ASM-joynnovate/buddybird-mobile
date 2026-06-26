import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { BuddyBirdColors } from '@/constants/theme';
import { useProfile } from '@/features/profile/profile-context';

export function RootNavigator() {
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
                contentStyle: styles.sessionScreen,
                navigationBarColor: BuddyBirdColors.neutral,
              }}
          />
          <Stack.Screen
              name="profile-edit"
              options={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: styles.sessionScreen,
                navigationBarColor: BuddyBirdColors.neutral,
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
    backgroundColor: BuddyBirdColors.neutral,
    flex: 1,
    justifyContent: 'center',
  },
  sessionScreen: {
    backgroundColor: BuddyBirdColors.neutral,
  },
});
