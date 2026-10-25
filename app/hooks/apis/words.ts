import { queryOptions, useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

import { postWordRecordingUpload, putUploadFile } from '@/apis/uploads';
import { deleteWord, deleteWordRecording, getWord, getWordList, patchWord, postWord } from '@/apis/words';

import type { IdParams } from '@/types/apis/common';

import { apiKeys } from '@/hooks/apis/keys';
import { wordKeys } from '@/hooks/apis/keys/words';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { reportError } from '@/services/telemetry/client';

/** 단어 목록 조회 Hook에 사용할 옵션 */
export const getWordListOptions = () => queryOptions({ queryKey: wordKeys.all(), queryFn: getWordList });
/** 단어 목록 조회 Hook */
export const useGetWordList = () => {
	return useSuspenseQuery(getWordListOptions());
};
/** suspense 없는 단어 목록 조회 Hook */
export const useGetWordListQuery = () => {
	return useQuery(getWordListOptions());
};

/** 단어 상세 조회 Hook에 사용할 옵션 */
export const getWordOptions = ({ id }: IdParams) =>
	queryOptions({ queryKey: wordKeys.detail(id), queryFn: () => getWord({ id }) });
/** 단어 상세 조회 Hook */
export const useGetWord = ({ id }: IdParams) => {
	return useSuspenseQuery(getWordOptions({ id }));
};
/** suspense 없는 단어 상세 조회 Hook */
export const useGetWordQuery = (
	{ id }: IdParams,
	options?: Pick<ReturnType<typeof getWordOptions>, 'enabled' | 'refetchInterval'>,
) => {
	return useQuery({ ...getWordOptions({ id }), ...options });
};

/** 단어 추가 Hook */
export const useCreateWord = () => {
	return useMutation({
		mutationKey: apiKeys.mutation('words', 'create'),
		mutationFn: postWord,
	});
};

/** 단어 이름 변경 Hook */
export const useRenameWord = () => {
	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('words', 'rename'),
		mutationFn: patchWord,
	});
};

/** 단어 삭제 Hook */
export const useDeleteWord = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('words', 'delete'),
		mutationFn: deleteWord,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: wordKeys.all() }),
		onError: (error) => reportError(error, 'word_delete'),
	});
};

/** 단어 녹음 추가 Hook */
export const useAddWordRecording = () => {
	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('words', 'recordings', 'add'),
		mutationFn: postWordRecordingUpload,
	});
};

/** 단어 녹음 파일 업로드 Hook */
export const useUploadWordRecording = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: apiKeys.mutation('words', 'recordings', 'upload'),
		mutationFn: putUploadFile,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: wordKeys.all() }),
	});
};

/** 단어 녹음 삭제 Hook */
export const useDeleteWordRecording = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('words', 'recordings', 'delete'),
		mutationFn: deleteWordRecording,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: wordKeys.all() }),
	});
};
