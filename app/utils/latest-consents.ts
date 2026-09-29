import type { Consent } from '@/types/apis/consents';

/** 약관 종류별 최신 버전만 남기는 함수 */
export const latestConsents = (consents: readonly Consent[]) => {
	return consents.filter(
		(consent) => !consents.some((other) => other.kind === consent.kind && other.version > consent.version),
	);
};
