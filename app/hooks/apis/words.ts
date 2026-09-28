import { mutationOptions, queryOptions } from '@tanstack/react-query';

import {
	deleteWord,
	deleteWordRecording,
	getWord,
	getWordList,
	patchWord,
	postWord,
	postWordRecording,
} from '@/apis/words';

import { invalidate } from '@/hooks/apis/invalidate';
import { apiKeys } from '@/hooks/apis/keys';

export const wordsQueryOptions = () => queryOptions({ queryKey: apiKeys.words.all(), queryFn: getWordList });

export const wordQueryOptions = (id: string) =>
	queryOptions({ queryKey: apiKeys.words.detail(id), queryFn: () => getWord({ id }) });

export const createWordMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('words', 'create'),
		mutationFn: ({ name, idempotencyKey }: { name: string; idempotencyKey: string }) =>
			postWord({ data: { name }, idempotencyKey }),
	});

export const renameWordMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('words', 'rename'),
		mutationFn: ({ id, name, idempotencyKey }: { id: string; name: string; idempotencyKey: string }) =>
			patchWord({ id, data: { name }, idempotencyKey }),
	});

export const deleteWordMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('words', 'delete'),
		mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
			deleteWord({ id, idempotencyKey }),
		onSuccess: () => invalidate(apiKeys.words.all()),
	});

export const addRecordingMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('words', 'recordings', 'add'),
		mutationFn: ({ wordId, uri, idempotencyKey }: { wordId: string; uri: string; idempotencyKey: string }) =>
			postWordRecording({ id: wordId, uri, idempotencyKey }),
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
		}) => deleteWordRecording({ id: wordId, recordingId, idempotencyKey }),
	});
