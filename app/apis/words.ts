import { postWordRecordingUpload, putUploadFile } from '@/apis/uploads';

import { type Word, wordSchema } from '@/types/apis/words';

import { z } from 'zod';

import { mockServer } from '@/mocks/server';

export const getWordList = async (): Promise<Word[]> => {
	return z.array(wordSchema).parse(await mockServer.words.list());
};

export const getWord = async ({ id }: { id: string }): Promise<Word> => {
	return wordSchema.parse(await mockServer.words.get(id));
};

export const postWord = async ({
	data,
	idempotencyKey,
}: {
	data: { name: string };
	idempotencyKey: string;
}): Promise<Word> => {
	return wordSchema.parse(await mockServer.words.create(data.name));
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
	return wordSchema.parse(await mockServer.words.update(id, data.name));
};

export const deleteWord = async ({ id, idempotencyKey }: { id: string; idempotencyKey: string }): Promise<void> => {
	await mockServer.words.remove(id);
};

export const postWordRecording = async ({
	id,
	uri,
	idempotencyKey,
}: {
	id: string;
	uri: string;
	idempotencyKey: string;
}): Promise<void> => {
	await putUploadFile({ upload: await postWordRecordingUpload({ id, idempotencyKey }), uri });
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
	await mockServer.words.removeRecording(id, recordingId);
};
