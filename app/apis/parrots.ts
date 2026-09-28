import { issueParrotPhotoUpload, putUpload } from '@/apis/uploads';

import { type CreateParrotRequest, type Parrot, parrotSchema, type UpdateParrotRequest } from '@/types/apis/parrots';

import { z } from 'zod';

import { mockServer } from '@/mocks/server';

export async function fetchParrots(): Promise<Parrot[]> {
	return z.array(parrotSchema).parse(await mockServer.parrots.list());
}

export async function createParrot(input: CreateParrotRequest, _idempotencyKey: string): Promise<Parrot> {
	return parrotSchema.parse(await mockServer.parrots.create(input));
}

export async function updateParrot(id: string, input: UpdateParrotRequest, _idempotencyKey: string): Promise<Parrot> {
	return parrotSchema.parse(await mockServer.parrots.update(id, input));
}

export async function deleteParrot(id: string, _idempotencyKey: string): Promise<void> {
	await mockServer.parrots.remove(id);
}

export async function uploadParrotPhoto(id: string, uri: string, idempotencyKey: string): Promise<void> {
	await putUpload(await issueParrotPhotoUpload(id, idempotencyKey), uri);
}

export async function deleteParrotPhoto(id: string, _idempotencyKey: string): Promise<void> {
	await mockServer.parrots.deletePhoto(id);
}
