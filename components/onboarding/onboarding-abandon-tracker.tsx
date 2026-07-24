import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useAnalytics } from '@/features/analytics/analytics-context';
import type { OnboardingStep } from '@/features/analytics/events';
import { useProfile } from '@/features/profile/profile-context';
import { isMediaPickerGateActive } from '@/features/shared/media-picker-gate';

/**
 * 온보딩 미완료 상태에서 앱이 background에 도달하면 onboarding_abandoned를 발화한다.
 * inactive에서 끝나는 blip(권한 다이얼로그·사진 시트·알림 쉐이드)은 이탈이 아니므로
 * background 도달만 본다 — `AppOpenTracker`의 active→inactive|background 조건보다 좁다.
 * 시스템 픽커로 인한 background(Android)는 media-picker-gate로 제외하고, 발화는
 * 온보딩 시도(마운트)당 최대 1회. 프로필 생성(=온보딩 완료) 이후에는 화면 전환 전
 * window에서도 발화하지 않는다.
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
  const hasFiredRef = useRef(false);

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

      if (nextState === 'active' && prevState.match(/inactive|background/)) {
        // 백그라운드 체류 시간이 duration에 섞이지 않게 복귀 시점 기준으로 리셋.
        stepEnteredAtRef.current = Date.now();
        return;
      }

      if (nextState !== 'background' || prevState === 'background') return;
      if (isCompletedRef.current || hasFiredRef.current || isMediaPickerGateActive()) return;

      hasFiredRef.current = true;
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
