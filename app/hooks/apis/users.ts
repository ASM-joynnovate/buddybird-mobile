import { type InfiniteData, queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

import { deleteUserBlock, getMe, patchMe, putUserBlock, putUserPhoto } from '@/apis/users';

import type { FeedPage } from '@/types/apis/feed';

import { apiKeys } from '@/hooks/apis/keys';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { reportError } from '@/services/telemetry/client';

/** 내 정보 조회 Hook에 사용할 옵션 */
export const getMeOptions = () => queryOptions({ queryKey: apiKeys.me(), queryFn: getMe });
/** 내 정보 조회 Hook */
export const useGetMe = () => {
	return useSuspenseQuery(getMeOptions());
};

/** 내 정보 수정 Hook */
export const useUpdateMe = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: apiKeys.mutation('users', 'me', 'update'),
		mutationFn: patchMe,
		onSuccess: () =>
			Promise.all([
				queryClient.invalidateQueries({ queryKey: apiKeys.me() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.leaderboard.all() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.feed.all() }),
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
			await queryClient.cancelQueries({ queryKey: apiKeys.feed.all() });

			queryClient.setQueriesData<InfiniteData<FeedPage>>(
				{ queryKey: apiKeys.feed.all() },
				(feedData) =>
					feedData && {
						...feedData,
						pages: feedData.pages.map((feedPage) => ({
							...feedPage,
							data: feedPage.data.filter((feedItem) => feedItem.user.id !== id),
						})),
					},
			);
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
		onSuccess: () => queryClient.invalidateQueries({ queryKey: apiKeys.feed.all() }),
		onError: (error) => reportError(error, 'user_unblock'),
	});
};

/** 계정 사진 업로드 Hook */
export const useUploadUserPhoto = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('users', 'me', 'photo', 'upload'),
		mutationFn: putUserPhoto,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: apiKeys.me() }),
	});
};
