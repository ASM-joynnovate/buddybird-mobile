import { queryOptions, useMutation, useSuspenseQuery } from '@tanstack/react-query';

import {
	deleteParrot,
	deleteParrotPhoto,
	getParrotList,
	patchParrot,
	postParrot,
	putParrotPhoto,
} from '@/apis/parrots';

import { invalidate } from '@/hooks/apis/invalidate';
import { apiKeys } from '@/hooks/apis/keys';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { reportError } from '@/services/telemetry/client';

/** 앵무새 목록 조회 Hook에 사용할 옵션 */
export const getParrotListOptions = () => queryOptions({ queryKey: apiKeys.parrots.all(), queryFn: getParrotList });
/** 앵무새 목록 조회 Hook */
export const useGetParrotList = () => {
	return useSuspenseQuery(getParrotListOptions());
};

/** 앵무새 등록 Hook */
export const useCreateParrot = () => {
	return useMutation({
		mutationKey: apiKeys.mutation('parrots', 'save'),
		mutationFn: postParrot,
		onSuccess: () => invalidate(apiKeys.parrots.all()),
	});
};

/** 앵무새 수정 Hook */
export const useUpdateParrot = () => {
	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('parrots', 'save'),
		mutationFn: patchParrot,
		onSuccess: () => invalidate(apiKeys.parrots.all()),
	});
};

/** 앵무새 삭제 Hook */
export const useDeleteParrot = () => {
	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('parrots', 'delete'),
		mutationFn: deleteParrot,
		onSuccess: () => invalidate(apiKeys.parrots.all()),
		onError: (error) => reportError(error, 'parrot_delete'),
	});
};

/** 앵무새 사진 업로드 Hook */
export const useUploadParrotPhoto = () => {
	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('parrots', 'photo', 'upload'),
		mutationFn: putParrotPhoto,
		onSuccess: () => invalidate(apiKeys.parrots.all()),
	});
};

/** 앵무새 사진 삭제 Hook */
export const useDeleteParrotPhoto = () => {
	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('parrots', 'photo', 'delete'),
		mutationFn: deleteParrotPhoto,
		onSuccess: () => invalidate(apiKeys.parrots.all()),
	});
};
