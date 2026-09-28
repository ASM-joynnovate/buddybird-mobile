import type { Events, OnboardingStep } from '@/types/telemetry';

import { track } from '@/services/telemetry/client';

type StepResult = Pick<
	Events['onboarding_step_completed'],
	'login_method' | 'microphone_granted' | 'notifications_granted'
>;

let onboardingStartedAt: number | null = null;
let stepViewedAt = 0;

export function viewOnboardingStep(step: OnboardingStep): void {
	stepViewedAt = Date.now();
	onboardingStartedAt ??= stepViewedAt;

	track('onboarding_step_viewed', { step });
}

export function completeOnboardingStep(step: OnboardingStep, result: StepResult = {}): void {
	track('onboarding_step_completed', { step, duration_ms: Date.now() - stepViewedAt, ...result });
}

export function completeOnboarding(): void {
	track('onboarding_completed', {
		total_duration_ms: onboardingStartedAt === null ? 0 : Date.now() - onboardingStartedAt,
	});

	onboardingStartedAt = null;
}
