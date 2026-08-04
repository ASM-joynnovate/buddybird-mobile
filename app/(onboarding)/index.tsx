import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

import { OnboardingWelcomeView } from '@/components/onboarding/onboarding-welcome-view';
import { useAnalytics } from '@/features/analytics/analytics-context';
import { useScreenTracking } from '@/features/analytics/hooks/use-screen-tracking';
import { useI18n } from '@/features/i18n/i18n-context';

export default function OnboardingWelcomeScreen() {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { elapsedMs } = useScreenTracking('onboarding_welcome');
  const hasStartedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      hasStartedRef.current = false;
    }, []),
  );

  function startOnboarding(): void {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    track({ name: 'onboarding_step_completed', params: { step: 'welcome', duration_ms: elapsedMs() } });
    router.push('/(onboarding)/profile');
  }

  return (
    <OnboardingWelcomeView
      bodyAfter={t('onboarding.welcome.bodyAfter')}
      bodyBefore={t('onboarding.welcome.bodyBefore')}
      bodyEmphasis={t('onboarding.welcome.bodyEmphasis')}
      bubble={t('onboarding.welcome.bubble')}
      ctaLabel={t('common.start')}
      onStart={startOnboarding}
      title={t('onboarding.welcome.title')}
    />
  );
}
