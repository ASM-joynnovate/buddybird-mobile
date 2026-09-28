import type { Consent } from '@/types/apis/consents';

export function latestConsents(consents: readonly Consent[]): Consent[] {
	return consents.filter(
		(consent) => !consents.some((other) => other.kind === consent.kind && other.version > consent.version),
	);
}
