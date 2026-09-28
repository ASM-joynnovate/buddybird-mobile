import { putParrotPhotoUpload, putUploadFile } from '@/apis/uploads';

import { type CreateParrotRequest, type Parrot, parrotSchema, type UpdateParrotRequest } from '@/types/apis/parrots';

import { z } from 'zod';

import { mockServer } from '@/mocks/server';

export const getParrotList = async (): Promise<Parrot[]> => {
	return z.array(parrotSchema).parse(await mockServer.parrots.list());
};

export const postParrot = async ({
	data,
	idempotencyKey,
}: {
	data: CreateParrotRequest;
	idempotencyKey: string;
}): Promise<Parrot> => {
	return parrotSchema.parse(await mockServer.parrots.create(data));
};

export const patchParrot = async ({
	id,
	data,
	idempotencyKey,
}: {
	id: string;
	data: UpdateParrotRequest;
	idempotencyKey: string;
}): Promise<Parrot> => {
	return parrotSchema.parse(await mockServer.parrots.update(id, data));
};

export const deleteParrot = async ({ id, idempotencyKey }: { id: string; idempotencyKey: string }): Promise<void> => {
	await mockServer.parrots.remove(id);
};

export const putParrotPhoto = async ({
	id,
	uri,
	idempotencyKey,
}: {
	id: string;
	uri: string;
	idempotencyKey: string;
}): Promise<void> => {
	await putUploadFile({ upload: await putParrotPhotoUpload({ id, idempotencyKey }), uri });
};

export const deleteParrotPhoto = async ({
	id,
	idempotencyKey,
}: {
	id: string;
	idempotencyKey: string;
}): Promise<void> => {
	await mockServer.parrots.deletePhoto(id);
};
