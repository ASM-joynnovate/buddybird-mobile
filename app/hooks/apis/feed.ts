import {
	type InfiniteData,
	infiniteQueryOptions,
	type QueryClient,
	queryOptions,
	useQueryClient,
	useSuspenseInfiniteQuery,
	useSuspenseQuery,
} from '@tanstack/react-query';

import { deleteFeedReaction, getFeedItemList, getFeedReactionTypeList, putFeedReaction } from '@/apis/feed';

import type { FeedItemReaction, FeedPage } from '@/types/apis/feed';

import { apiKeys } from '@/hooks/apis/keys';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { reportError } from '@/services/telemetry/client';

/** 내 반응을 더한 반응 목록을 반환하는 함수 */
const withMyReaction = (reactions: FeedItemReaction[], reactionTypeId: string) => {
	const reaction = reactions.find((item) => item.reaction_type_id === reactionTypeId);

	if (!reaction) {
		return [...reactions, { reaction_type_id: reactionTypeId, count: 1, is_mine: true }];
	}

	if (reaction.is_mine) {
		return reactions;
	}

	return reactions.map((item) => (item === reaction ? { ...item, count: item.count + 1, is_mine: true } : item));
};

/** 내 반응을 뺀 반응 목록을 반환하는 함수 */
const withoutMyReaction = (reactions: FeedItemReaction[], reactionTypeId: string) => {
	const reaction = reactions.find((item) => item.reaction_type_id === reactionTypeId && item.is_mine);

	if (!reaction) {
		return reactions;
	}

	if (reaction.count === 1) {
		return reactions.filter((item) => item !== reaction);
	}

	return reactions.map((item) => (item === reaction ? { ...item, count: item.count - 1, is_mine: false } : item));
};

/** 피드 목록 캐시에서 피드 항목 하나의 반응 목록을 변경하는 함수 */
const updateCachedFeedItemReactions = (
	queryClient: QueryClient,
	id: string,
	updateReactions: (reactions: FeedItemReaction[]) => FeedItemReaction[],
) => {
	queryClient.setQueriesData<InfiniteData<FeedPage>>(
		{ queryKey: apiKeys.feed.all() },
		(feedData) =>
			feedData && {
				...feedData,
				pages: feedData.pages.map((feedPage) => ({
					...feedPage,
					data: feedPage.data.map((feedItem) =>
						feedItem.id === id ? { ...feedItem, reactions: updateReactions(feedItem.reactions) } : feedItem,
					),
				})),
			},
	);
};

/** 피드 목록 조회 Hook에 사용할 옵션 */
export const getFeedItemListOptions = ({ country }: { country: string | null }) =>
	infiniteQueryOptions({
		queryKey: apiKeys.feed.list(country),
		queryFn: ({ pageParam }) => getFeedItemList({ cursor: pageParam, country }),
		initialPageParam: null as string | null,
		getNextPageParam: (lastPage) => lastPage.meta.next_cursor ?? undefined,
	});
/** 피드 목록 조회 Hook */
export const useGetFeedItemList = ({ country }: { country: string | null }) => {
	return useSuspenseInfiniteQuery(getFeedItemListOptions({ country }));
};

/** 반응 종류 목록 조회 Hook에 사용할 옵션 */
export const getFeedReactionTypeListOptions = () =>
	queryOptions({ queryKey: apiKeys.feedReactionTypes(), queryFn: getFeedReactionTypeList });
/** 반응 종류 목록 조회 Hook */
export const useGetFeedReactionTypeList = () => {
	return useSuspenseQuery(getFeedReactionTypeListOptions());
};

/** 반응 추가 Hook */
export const useAddFeedReaction = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('feed', 'reactions', 'add'),
		mutationFn: putFeedReaction,
		onMutate: async ({ id, reactionTypeId }) => {
			await queryClient.cancelQueries({ queryKey: apiKeys.feed.all() });

			updateCachedFeedItemReactions(queryClient, id, (reactions) => withMyReaction(reactions, reactionTypeId));
		},
		onSuccess: (reactions, { id }) => updateCachedFeedItemReactions(queryClient, id, () => reactions),
		onError: (error, { id, reactionTypeId }) => {
			updateCachedFeedItemReactions(queryClient, id, (reactions) => withoutMyReaction(reactions, reactionTypeId));

			reportError(error, 'feed_reaction_add');
		},
	});
};

/** 반응 삭제 Hook */
export const useDeleteFeedReaction = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('feed', 'reactions', 'delete'),
		mutationFn: deleteFeedReaction,
		onMutate: async ({ id, reactionTypeId }) => {
			await queryClient.cancelQueries({ queryKey: apiKeys.feed.all() });

			updateCachedFeedItemReactions(queryClient, id, (reactions) => withoutMyReaction(reactions, reactionTypeId));
		},
		onSuccess: (reactions, { id }) => updateCachedFeedItemReactions(queryClient, id, () => reactions),
		onError: (error, { id, reactionTypeId }) => {
			updateCachedFeedItemReactions(queryClient, id, (reactions) => withMyReaction(reactions, reactionTypeId));

			reportError(error, 'feed_reaction_delete');
		},
	});
};
