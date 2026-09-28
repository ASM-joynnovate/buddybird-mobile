import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { fetchConsents, saveConsent } from '@/apis/consents';

import type { SaveConsentRequest } from '@/types/apis/consents';

import { invalidate } from '@/hooks/apis/invalidate';
import { apiKeys } from '@/hooks/apis/keys';

export const consentsQueryOptions = () => queryOptions({ queryKey: apiKeys.consents.all(), queryFn: fetchConsents });

export const saveConsentMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('users', 'me', 'consents'),
		mutationFn: ({ decision, idempotencyKey }: { decision: SaveConsentRequest; idempotencyKey: string }) =>
			saveConsent(decision, idempotencyKey),
		onSuccess: () => invalidate(apiKeys.consents.all()),
	});
