import { mutationOptions, queryOptions } from '@tanstack/react-query';

import {
	deleteParrot,
	deleteParrotPhoto,
	getParrotList,
	patchParrot,
	postParrot,
	putParrotPhoto,
} from '@/apis/parrots';

import type { CreateParrotRequest } from '@/types/apis/parrots';

import { invalidate } from '@/hooks/apis/invalidate';
import { apiKeys } from '@/hooks/apis/keys';

export const parrotsQueryOptions = () => queryOptions({ queryKey: apiKeys.parrots.all(), queryFn: getParrotList });

export const saveParrotMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('parrots', 'save'),
		mutationFn: ({
			id,
			input,
			idempotencyKey,
		}: {
			id: string | null;
			input: CreateParrotRequest;
			idempotencyKey: string;
		}) => (id ? patchParrot({ id, data: input, idempotencyKey }) : postParrot({ data: input, idempotencyKey })),
		onSuccess: () => invalidate(apiKeys.parrots.all()),
	});

export const deleteParrotMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('parrots', 'delete'),
		mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
			deleteParrot({ id, idempotencyKey }),
		onSuccess: () => invalidate(apiKeys.parrots.all()),
	});

export const uploadParrotPhotoMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('parrots', 'photo', 'upload'),
		mutationFn: ({ id, uri, idempotencyKey }: { id: string; uri: string; idempotencyKey: string }) =>
			putParrotPhoto({ id, uri, idempotencyKey }),
		onSuccess: () => invalidate(apiKeys.parrots.all()),
	});

export const deleteParrotPhotoMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('parrots', 'photo', 'delete'),
		mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
			deleteParrotPhoto({ id, idempotencyKey }),
		onSuccess: () => invalidate(apiKeys.parrots.all()),
	});
