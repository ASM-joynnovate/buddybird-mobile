import { type Consent, consentSchema, type SaveConsentRequest } from '@/types/apis/consents';

import { apiRequest } from '@/lib/api';

import { z } from 'zod';

export const getConsentList = async (): Promise<Consent[]> => {
	const { data: consents } = await apiRequest('/api/v1/consents', z.array(consentSchema));

	return consents;
};

export const postConsent = async ({
	data,
	idempotencyKey,
}: {
	data: SaveConsentRequest;
	idempotencyKey: string;
}): Promise<void> => {
	await apiRequest('/api/v1/users/me/consents', z.unknown(), { method: 'POST', json: data, idempotencyKey });
};
