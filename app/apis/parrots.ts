import { putParrotPhotoUpload, putUploadFile } from '@/apis/uploads';

import { type CreateParrotRequest, type Parrot, parrotSchema, type UpdateParrotRequest } from '@/types/apis/parrots';

import { apiRequest } from '@/lib/api';

import { z } from 'zod';

export const getParrotList = async (): Promise<Parrot[]> => {
	const { data: parrots } = await apiRequest('/api/v1/parrots', z.array(parrotSchema));

	return parrots;
};

export const postParrot = async ({
	data,
	idempotencyKey,
}: {
	data: CreateParrotRequest;
	idempotencyKey: string;
}): Promise<Parrot> => {
	const { data: parrot } = await apiRequest('/api/v1/parrots', parrotSchema, {
		method: 'POST',
		json: data,
		idempotencyKey,
	});

	return parrot;
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
	const { data: parrot } = await apiRequest(`/api/v1/parrots/${id}`, parrotSchema, {
		method: 'PATCH',
		json: data,
		idempotencyKey,
	});

	return parrot;
};

export const deleteParrot = async ({ id, idempotencyKey }: { id: string; idempotencyKey: string }): Promise<void> => {
	await apiRequest(`/api/v1/parrots/${id}`, z.unknown(), { method: 'DELETE', idempotencyKey });
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
	await putUploadFile({ upload: await putParrotPhotoUpload({ id, uri, idempotencyKey }), uri });
};
