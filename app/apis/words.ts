import type { IdParams, IdempotentIdParams } from '@/types/apis/common';
import {
	type DeleteWordRecordingParams,
	type PatchWordParams,
	type PostWordParams,
	type Word,
	wordSchema,
} from '@/types/apis/words';

import { apiRequest } from '@/lib/api';

import { z } from 'zod';

export const getWordList = async (): Promise<Word[]> => {
	const { data: words } = await apiRequest('/api/v1/words', z.array(wordSchema));

	return words;
};

export const getWord = async ({ id }: IdParams): Promise<Word> => {
	const { data: word } = await apiRequest(`/api/v1/words/${id}`, wordSchema);

	return word;
};

export const postWord = async ({ data, idempotencyKey }: PostWordParams): Promise<Word> => {
	const { data: word } = await apiRequest('/api/v1/words', wordSchema, {
		method: 'POST',
		json: data,
		idempotencyKey,
	});

	return word;
};

export const patchWord = async ({ id, data, idempotencyKey }: PatchWordParams): Promise<Word> => {
	const { data: word } = await apiRequest(`/api/v1/words/${id}`, wordSchema, {
		method: 'PATCH',
		json: data,
		idempotencyKey,
	});

	return word;
};

export const deleteWord = async ({ id, idempotencyKey }: IdempotentIdParams): Promise<void> => {
	await apiRequest(`/api/v1/words/${id}`, z.unknown(), { method: 'DELETE', idempotencyKey });
};

export const deleteWordRecording = async ({
	id,
	recordingId,
	idempotencyKey,
}: DeleteWordRecordingParams): Promise<void> => {
	await apiRequest(`/api/v1/words/${id}/recordings/${recordingId}`, z.unknown(), {
		method: 'DELETE',
		idempotencyKey,
	});
};
