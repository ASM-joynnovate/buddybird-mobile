import { type Word, wordSchema } from '@/types/apis/words';

import { apiRequest } from '@/lib/api';

import { z } from 'zod';

export const getWordList = async (): Promise<Word[]> => {
	const { data: words } = await apiRequest('/api/v1/words', z.array(wordSchema));

	return words;
};

export const getWord = async ({ id }: { id: string }): Promise<Word> => {
	const { data: word } = await apiRequest(`/api/v1/words/${id}`, wordSchema);

	return word;
};

export const postWord = async ({
	data,
	idempotencyKey,
}: {
	data: { name: string };
	idempotencyKey: string;
}): Promise<Word> => {
	const { data: word } = await apiRequest('/api/v1/words', wordSchema, {
		method: 'POST',
		json: data,
		idempotencyKey,
	});

	return word;
};

export const patchWord = async ({
	id,
	data,
	idempotencyKey,
}: {
	id: string;
	data: { name: string };
	idempotencyKey: string;
}): Promise<Word> => {
	const { data: word } = await apiRequest(`/api/v1/words/${id}`, wordSchema, {
		method: 'PATCH',
		json: data,
		idempotencyKey,
	});

	return word;
};

export const deleteWord = async ({ id, idempotencyKey }: { id: string; idempotencyKey: string }): Promise<void> => {
	await apiRequest(`/api/v1/words/${id}`, z.unknown(), { method: 'DELETE', idempotencyKey });
};

export const deleteWordRecording = async ({
	id,
	recordingId,
	idempotencyKey,
}: {
	id: string;
	recordingId: string;
	idempotencyKey: string;
}): Promise<void> => {
	await apiRequest(`/api/v1/words/${id}/recordings/${recordingId}`, z.unknown(), {
		method: 'DELETE',
		idempotencyKey,
	});
};
