import { putParrotPhotoUpload, putUploadFile } from '@/apis/uploads';

import type { IdempotentIdParams } from '@/types/apis/common';
import { type Parrot, parrotSchema, type PatchParrotParams, type PostParrotParams } from '@/types/apis/parrots';
import type { IdFileUploadParams } from '@/types/apis/uploads';

import { apiRequest } from '@/lib/api';

import { z } from 'zod';

export const getParrotList = async (): Promise<Parrot[]> => {
	const { data: parrots } = await apiRequest('/api/v1/parrots', z.array(parrotSchema));

	return parrots;
};

export const postParrot = async ({ data, idempotencyKey }: PostParrotParams): Promise<Parrot> => {
	const { data: parrot } = await apiRequest('/api/v1/parrots', parrotSchema, {
		method: 'POST',
		json: data,
		idempotencyKey,
	});

	return parrot;
};

export const patchParrot = async ({ id, data, idempotencyKey }: PatchParrotParams): Promise<Parrot> => {
	const { data: parrot } = await apiRequest(`/api/v1/parrots/${id}`, parrotSchema, {
		method: 'PATCH',
		json: data,
		idempotencyKey,
	});

	return parrot;
};

export const deleteParrot = async ({ id, idempotencyKey }: IdempotentIdParams): Promise<void> => {
	await apiRequest(`/api/v1/parrots/${id}`, z.unknown(), { method: 'DELETE', idempotencyKey });
};

export const putParrotPhoto = async ({ id, uri, idempotencyKey }: IdFileUploadParams): Promise<void> => {
	await putUploadFile({ upload: await putParrotPhotoUpload({ id, uri, idempotencyKey }), uri });
};
