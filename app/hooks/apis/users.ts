import { queryOptions, useMutation, useSuspenseQuery } from '@tanstack/react-query';

import { deleteUserPhoto, getMe, patchMe, putUserPhoto } from '@/apis/users';

import { invalidate } from '@/hooks/apis/invalidate';
import { apiKeys } from '@/hooks/apis/keys';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

/** 내 정보 조회 옵션 */
export const getMeOptions = () => queryOptions({ queryKey: apiKeys.me(), queryFn: getMe });
/** 내 정보 조회 훅 */
export const useGetMe = () => {
	return useSuspenseQuery(getMeOptions());
};

/** 내 정보 수정 훅 */
export const useUpdateMe = () => {
	return useMutation({
		mutationKey: apiKeys.mutation('users', 'me', 'update'),
		mutationFn: patchMe,
		onSuccess: () => invalidate(apiKeys.me()),
	});
};

/** 계정 사진 업로드 훅 */
export const useUploadUserPhoto = () => {
	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('users', 'me', 'photo', 'upload'),
		mutationFn: putUserPhoto,
		onSuccess: () => invalidate(apiKeys.me()),
	});
};

/** 계정 사진 삭제 훅 */
export const useDeleteUserPhoto = () => {
	return useMutation({
		mutationKey: apiKeys.mutation('users', 'me', 'photo', 'delete'),
		mutationFn: deleteUserPhoto,
		onSuccess: () => invalidate(apiKeys.me()),
	});
};
