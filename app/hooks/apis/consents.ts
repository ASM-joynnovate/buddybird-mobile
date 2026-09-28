import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { getConsentList, postConsent } from '@/apis/consents';

import type { SaveConsentRequest } from '@/types/apis/consents';

import { invalidate } from '@/hooks/apis/invalidate';
import { apiKeys } from '@/hooks/apis/keys';

export const consentsQueryOptions = () => queryOptions({ queryKey: apiKeys.consents.all(), queryFn: getConsentList });

export const saveConsentMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('users', 'me', 'consents'),
		mutationFn: ({ data, idempotencyKey }: { data: SaveConsentRequest; idempotencyKey: string }) =>
			postConsent({ data, idempotencyKey }),
		onSuccess: () => invalidate(apiKeys.consents.all()),
	});
