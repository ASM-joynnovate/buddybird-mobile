import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { deletePhoto, fetchMe, updateMe, uploadPhoto } from '@/apis/users';

import type { UpdateUserRequest } from '@/types/apis/users';

import { invalidate } from '@/hooks/apis/invalidate';
import { apiKeys } from '@/hooks/apis/keys';

export const meQueryOptions = () => queryOptions({ queryKey: apiKeys.me(), queryFn: fetchMe });

export const updateMeMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('users', 'me', 'update'),
		mutationFn: (input: UpdateUserRequest) => updateMe(input),
		onSuccess: () => invalidate(apiKeys.me()),
	});

export const uploadPhotoMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('users', 'me', 'photo', 'upload'),
		mutationFn: (uri: string) => uploadPhoto(uri),
		onSuccess: () => invalidate(apiKeys.me()),
	});

export const deletePhotoMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('users', 'me', 'photo', 'delete'),
		mutationFn: () => deletePhoto(),
		onSuccess: () => invalidate(apiKeys.me()),
	});
