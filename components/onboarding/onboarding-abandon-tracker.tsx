import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useAnalytics } from '@/features/analytics/analytics-context';
import type { OnboardingStep } from '@/features/analytics/events';
import { useProfile } from '@/features/profile/profile-context';

/**
 * 온보딩 미완료 상태에서 앱이 백그라운드로 전환되면 onboarding_abandoned를 발화한다.
 * `AppOpenTracker`와 동일한 AppState 전이 감지 패턴. 프로필 생성(=온보딩 완료) 이후에는
 * 화면 전환 전 window에서도 발화하지 않는다.
 */
export function OnboardingAbandonTracker() {
  const { isReady, track } = useAnalytics();
  const { profile } = useProfile();
  const pathname = usePathname();

  const step: OnboardingStep = pathname.endsWith('/profile') ? 'profile' : 'welcome';

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const stepRef = useRef<OnboardingStep>(step);
  const stepEnteredAtRef = useRef<number>(null!);
  if (stepEnteredAtRef.current === null) {
    stepEnteredAtRef.current = Date.now();
  }
  const isCompletedRef = useRef(profile !== null);

  useEffect(() => {
    isCompletedRef.current = profile !== null;
  }, [profile]);

  useEffect(() => {
    if (stepRef.current === step) return;

    stepRef.current = step;
    stepEnteredAtRef.current = Date.now();
  }, [step]);

  useEffect(() => {
    if (!isReady) return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (prevState !== 'active' || !nextState.match(/inactive|background/)) return;
      if (isCompletedRef.current) return;

      track({
        name: 'onboarding_abandoned',
        params: {
          last_step: stepRef.current,
          last_step_duration_ms: Date.now() - stepEnteredAtRef.current,
        },
      });
    });

    return () => subscription.remove();
  }, [isReady, track]);

  return null;
}
