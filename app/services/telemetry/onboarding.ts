import type { AnalyticsEvents, OnboardingStep } from '@/types/telemetry';

import dayjs from 'dayjs';

import { track } from '@/services/telemetry/client';

type StepCompletedParams = Pick<
	AnalyticsEvents['onboarding_step_completed'],
	'login_method' | 'microphone_granted' | 'notifications_granted'
>;

let onboardingStartedAt: number | null = null;
let stepViewedAt = 0;

export function trackOnboardingStepViewed(step: OnboardingStep): void {
	stepViewedAt = dayjs().valueOf();
	onboardingStartedAt ??= stepViewedAt;

	track('onboarding_step_viewed', { step });
}

export function trackOnboardingStepCompleted(step: OnboardingStep, stepParams: StepCompletedParams = {}): void {
	track('onboarding_step_completed', { step, duration_ms: dayjs().diff(stepViewedAt), ...stepParams });
}

export function trackOnboardingCompleted(): void {
	track('onboarding_completed', {
		total_duration_ms: onboardingStartedAt === null ? 0 : dayjs().diff(onboardingStartedAt),
	});

	onboardingStartedAt = null;
}
