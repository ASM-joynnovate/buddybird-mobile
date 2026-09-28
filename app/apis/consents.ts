import { type Consent, consentSchema, type SaveConsentRequest } from '@/types/apis/consents';

import { z } from 'zod';

import { mockServer } from '@/mocks/server';

export const getConsentList = async (): Promise<Consent[]> => {
	return z.array(consentSchema).parse(await mockServer.consents.list());
};

export const postConsent = async ({
	data,
	idempotencyKey,
}: {
	data: SaveConsentRequest;
	idempotencyKey: string;
}): Promise<void> => {
	await mockServer.consents.save(data);
};
