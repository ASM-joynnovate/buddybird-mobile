import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { useAnalytics } from '@/features/analytics/analytics-context';
import { OnboardingDraftProvider } from '@/features/profile/onboarding-draft-context';

export default function OnboardingLayout() {
  const { isReady, track } = useAnalytics();

  useEffect(() => {
    if (!isReady) return;

    track({ name: 'onboarding_started', params: {} });
  }, [isReady, track]);

  return (
    <OnboardingDraftProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </OnboardingDraftProvider>
  );
}
