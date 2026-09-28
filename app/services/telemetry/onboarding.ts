import type { AnalyticsEvents, OnboardingStep } from '@/types/telemetry';

import dayjs from 'dayjs';

import { track } from '@/services/telemetry/client';

type StepCompletedParams = Pick<
	AnalyticsEvents['onboarding_step_completed'],
	'login_method' | 'microphone_granted' | 'notifications_granted'
>;

let onboardingStartedAt: number | null = null;
let stepViewedAt = 0;

/** 온보딩 단계를 보여 준 시각 기록과 onboarding_step_viewed 이벤트 전송 */
export const trackOnboardingStepViewed = (step: OnboardingStep) => {
	stepViewedAt = dayjs().valueOf();
	onboardingStartedAt ??= stepViewedAt;

	track('onboarding_step_viewed', { step });
};

/** 단계에 머문 시간과 함께 onboarding_step_completed 이벤트 전송 */
export const trackOnboardingStepCompleted = (step: OnboardingStep, stepParams: StepCompletedParams = {}) => {
	track('onboarding_step_completed', { step, duration_ms: dayjs().diff(stepViewedAt), ...stepParams });
};

/** 온보딩 전체에 걸린 시간과 함께 onboarding_completed 이벤트 전송 */
export const trackOnboardingCompleted = () => {
	track('onboarding_completed', {
		total_duration_ms: onboardingStartedAt === null ? 0 : dayjs().diff(onboardingStartedAt),
	});

	onboardingStartedAt = null;
};
