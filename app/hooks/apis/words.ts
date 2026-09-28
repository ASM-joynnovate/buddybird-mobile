import { queryOptions, useMutation, useSuspenseQuery } from '@tanstack/react-query';

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
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { reportError } from '@/services/telemetry/client';

/** 단어 목록 조회 옵션 */
export const getWordListOptions = () => queryOptions({ queryKey: apiKeys.words.all(), queryFn: getWordList });
/** 단어 목록 조회 훅 */
export const useGetWordList = () => {
	return useSuspenseQuery(getWordListOptions());
};

/** 단어 조회 옵션 */
export const getWordOptions = ({ id }: { id: string }) =>
	queryOptions({ queryKey: apiKeys.words.detail(id), queryFn: () => getWord({ id }) });
/** 단어 조회 훅 */
export const useGetWord = ({ id }: { id: string }) => {
	return useSuspenseQuery(getWordOptions({ id }));
};

/** 단어 만들기 훅 */
export const useCreateWord = () => {
	return useMutation({
		mutationKey: apiKeys.mutation('words', 'create'),
		mutationFn: postWord,
	});
};

/** 단어 이름 변경 훅 */
export const useRenameWord = () => {
	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('words', 'rename'),
		mutationFn: patchWord,
	});
};

/** 단어 삭제 훅 */
export const useDeleteWord = () => {
	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('words', 'delete'),
		mutationFn: deleteWord,
		onSuccess: () => invalidate(apiKeys.words.all()),
		onError: (error) => reportError(error, 'word_delete'),
	});
};

/** 단어 녹음 추가 훅 */
export const useAddWordRecording = () => {
	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('words', 'recordings', 'add'),
		mutationFn: postWordRecording,
	});
};

/** 단어 녹음 삭제 훅 */
export const useDeleteWordRecording = () => {
	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('words', 'recordings', 'delete'),
		mutationFn: deleteWordRecording,
	});
};
