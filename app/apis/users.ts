import { putUploadFile, putUserPhotoUpload } from '@/apis/uploads';

import { type UpdateUserRequest, type User, userSchema } from '@/types/apis/users';

import { apiRequest } from '@/lib/api';

import { z } from 'zod';

export const getMe = async (): Promise<User> => {
	const { data: user } = await apiRequest('/api/v1/users/me', userSchema);

	return user;
};

export const patchMe = async ({ data }: { data: UpdateUserRequest }): Promise<void> => {
	await apiRequest('/api/v1/users/me', z.unknown(), { method: 'PATCH', json: data });
};

export const putUserPhoto = async ({ uri, idempotencyKey }: { uri: string; idempotencyKey: string }): Promise<void> => {
	await putUploadFile({ upload: await putUserPhotoUpload({ uri, idempotencyKey }), uri });
};
