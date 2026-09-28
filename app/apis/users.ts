import { putUploadFile, putUserPhotoUpload } from '@/apis/uploads';

import { type UpdateUserRequest, type User, userSchema } from '@/types/apis/users';

import { mockServer } from '@/mocks/server';

export const getMe = async (): Promise<User> => {
	return userSchema.parse(await mockServer.users.me());
};

export const patchMe = async ({ data }: { data: UpdateUserRequest }): Promise<void> => {
	await mockServer.users.update(data);
};

export const putUserPhoto = async ({ uri, idempotencyKey }: { uri: string; idempotencyKey: string }): Promise<void> => {
	await putUploadFile({ upload: await putUserPhotoUpload({ idempotencyKey }), uri });
};

export const deleteUserPhoto = async (): Promise<void> => {
	await mockServer.users.deletePhoto();
};
