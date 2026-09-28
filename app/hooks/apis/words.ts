import { mutationOptions, queryOptions } from '@tanstack/react-query';

import {
	addWordRecording,
	createWord,
	deleteWord,
	deleteWordRecording,
	fetchWord,
	fetchWords,
	renameWord,
} from '@/apis/words';

import { invalidate } from '@/hooks/apis/invalidate';
import { apiKeys } from '@/hooks/apis/keys';

export const wordsQueryOptions = () => queryOptions({ queryKey: apiKeys.words.all(), queryFn: fetchWords });

export const wordQueryOptions = (id: string) =>
	queryOptions({ queryKey: apiKeys.words.detail(id), queryFn: () => fetchWord(id) });

export const createWordMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('words', 'create'),
		mutationFn: ({ name, idempotencyKey }: { name: string; idempotencyKey: string }) =>
			createWord(name, idempotencyKey),
	});

export const renameWordMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('words', 'rename'),
		mutationFn: ({ id, name, idempotencyKey }: { id: string; name: string; idempotencyKey: string }) =>
			renameWord(id, name, idempotencyKey),
	});

export const deleteWordMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('words', 'delete'),
		mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) => deleteWord(id, idempotencyKey),
		onSuccess: () => invalidate(apiKeys.words.all()),
	});

export const addRecordingMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('words', 'recordings', 'add'),
		mutationFn: ({ wordId, uri, idempotencyKey }: { wordId: string; uri: string; idempotencyKey: string }) =>
			addWordRecording(wordId, uri, idempotencyKey),
	});

export const deleteRecordingMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('words', 'recordings', 'delete'),
		mutationFn: ({
			wordId,
			recordingId,
			idempotencyKey,
		}: {
			wordId: string;
			recordingId: string;
			idempotencyKey: string;
		}) => deleteWordRecording(wordId, recordingId, idempotencyKey),
	});
