import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { deleteUserPhoto, getMe, patchMe, putUserPhoto } from '@/apis/users';

import type { UpdateUserRequest } from '@/types/apis/users';

import { invalidate } from '@/hooks/apis/invalidate';
import { apiKeys } from '@/hooks/apis/keys';

export const meQueryOptions = () => queryOptions({ queryKey: apiKeys.me(), queryFn: getMe });

export const updateMeMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('users', 'me', 'update'),
		mutationFn: (input: UpdateUserRequest) => patchMe({ data: input }),
		onSuccess: () => invalidate(apiKeys.me()),
	});

export const uploadPhotoMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('users', 'me', 'photo', 'upload'),
		mutationFn: ({ uri, idempotencyKey }: { uri: string; idempotencyKey: string }) =>
			putUserPhoto({ uri, idempotencyKey }),
		onSuccess: () => invalidate(apiKeys.me()),
	});

export const deletePhotoMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('users', 'me', 'photo', 'delete'),
		mutationFn: () => deleteUserPhoto(),
		onSuccess: () => invalidate(apiKeys.me()),
	});
