import type { Consent } from '@/types/apis/consents';

/** 종류마다 최신 버전만 남긴 동의 목록 */
export const latestConsents = (consents: readonly Consent[]) => {
	return consents.filter(
		(consent) => !consents.some((other) => other.kind === consent.kind && other.version > consent.version),
	);
};
