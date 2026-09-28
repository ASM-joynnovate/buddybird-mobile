import { issuePhotoUpload, putUpload } from '@/apis/uploads';

import { type UpdateUserRequest, type User, userSchema } from '@/types/apis/users';

import { mockServer } from '@/mocks/server';

export async function fetchMe(): Promise<User> {
	return userSchema.parse(await mockServer.users.me());
}

export async function updateMe(input: UpdateUserRequest): Promise<void> {
	await mockServer.users.update(input);
}

export async function uploadPhoto(uri: string): Promise<void> {
	await putUpload(await issuePhotoUpload(), uri);
}

export async function deletePhoto(): Promise<void> {
	await mockServer.users.deletePhoto();
}
