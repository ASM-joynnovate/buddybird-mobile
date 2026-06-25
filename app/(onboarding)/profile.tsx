import { router } from 'expo-router';

import { OnboardingProfileFlow } from '@/components/onboarding/onboarding-profile-flow';

export default function OnboardingProfileScreen() {
  return <OnboardingProfileFlow onBack={() => router.replace('/(onboarding)')} />;
}
