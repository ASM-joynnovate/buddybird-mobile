import { queryOptions, useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

import { deleteUserBlock, getMe, patchMe, putUserBlock, putUserPhoto } from '@/apis/users';

import { updateCachedFeedItems } from '@/hooks/apis/feed';
import { apiKeys } from '@/hooks/apis/keys';
import { feedKeys } from '@/hooks/apis/keys/feed';
import { leaderboardKeys } from '@/hooks/apis/keys/leaderboard';
import { userKeys } from '@/hooks/apis/keys/users';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { reportError } from '@/services/telemetry/client';

/** 내 정보 조회 Hook에 사용할 옵션 */
export const getMeOptions = () => queryOptions({ queryKey: userKeys.me(), queryFn: getMe });
/** 내 정보 조회 Hook */
export const useGetMe = (options?: Pick<ReturnType<typeof getMeOptions>, 'refetchInterval'>) => {
	return useSuspenseQuery({ ...getMeOptions(), ...options });
};
/** suspense 없는 내 정보 조회 Hook */
export const useGetMeQuery = () => {
	return useQuery(getMeOptions());
};

/** 내 정보 수정 Hook */
export const useUpdateMe = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: apiKeys.mutation('users', 'me', 'update'),
		mutationFn: patchMe,
		onSuccess: () =>
			Promise.all([
				queryClient.invalidateQueries({ queryKey: userKeys.me() }),
				queryClient.invalidateQueries({ queryKey: leaderboardKeys.all() }),
				queryClient.invalidateQueries({ queryKey: feedKeys.all() }),
			]),
	});
};

/** 사용자 차단 Hook */
export const useBlockUser = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('users', 'me', 'blocks', 'add'),
		mutationFn: putUserBlock,
		onSuccess: async (_, { id }) => {
			await queryClient.cancelQueries({ queryKey: feedKeys.all() });

			updateCachedFeedItems(queryClient, (feedItems) => feedItems.filter((feedItem) => feedItem.user.id !== id));
		},
		onError: (error) => reportError(error, 'user_block'),
	});
};

/** 사용자 차단 해제 Hook */
export const useUnblockUser = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('users', 'me', 'blocks', 'delete'),
		mutationFn: deleteUserBlock,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: feedKeys.all() }),
		onError: (error) => reportError(error, 'user_unblock'),
	});
};

/** 계정 사진 업로드 Hook */
export const useUploadUserPhoto = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('users', 'me', 'photo', 'upload'),
		mutationFn: putUserPhoto,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.me() }),
	});
};
