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

import type { CountryParams } from '@/types/apis/common';
import type { FeedItem, FeedItemReaction, FeedPage } from '@/types/apis/feed';

import { apiKeys } from '@/hooks/apis/keys';
import { feedKeys } from '@/hooks/apis/keys/feed';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { reportError } from '@/services/telemetry/client';

/** 내 반응을 더한 반응 목록을 반환하는 함수 */
const withMyReaction = (reactions: FeedItemReaction[], reactionTypeId: string) => {
	const reaction = reactions.find((feedReaction) => feedReaction.reaction_type_id === reactionTypeId);

	if (!reaction) {
		return [...reactions, { reaction_type_id: reactionTypeId, count: 1, is_mine: true }];
	}

	if (reaction.is_mine) {
		return reactions;
	}

	return reactions.map((feedReaction) =>
		feedReaction === reaction ? { ...feedReaction, count: feedReaction.count + 1, is_mine: true } : feedReaction,
	);
};

/** 내 반응을 뺀 반응 목록을 반환하는 함수 */
const withoutMyReaction = (reactions: FeedItemReaction[], reactionTypeId: string) => {
	const reaction = reactions.find(
		(feedReaction) => feedReaction.reaction_type_id === reactionTypeId && feedReaction.is_mine,
	);

	if (!reaction) {
		return reactions;
	}

	if (reaction.count === 1) {
		return reactions.filter((feedReaction) => feedReaction !== reaction);
	}

	return reactions.map((feedReaction) =>
		feedReaction === reaction ? { ...feedReaction, count: feedReaction.count - 1, is_mine: false } : feedReaction,
	);
};

/** 피드 목록 캐시의 피드 항목을 변경하는 함수 */
export const updateCachedFeedItems = (
	queryClient: QueryClient,
	updateFeedItems: (feedItems: FeedItem[]) => FeedItem[],
) => {
	queryClient.setQueriesData<InfiniteData<FeedPage>>(
		{ queryKey: feedKeys.all() },
		(feedData) =>
			feedData && {
				...feedData,
				pages: feedData.pages.map((feedPage) => ({ ...feedPage, data: updateFeedItems(feedPage.data) })),
			},
	);
};

/** 캐시의 피드 항목 반응 목록 변경 함수 */
const updateCachedFeedItemReactions = (
	queryClient: QueryClient,
	id: string,
	updateReactions: (reactions: FeedItemReaction[]) => FeedItemReaction[],
) => {
	updateCachedFeedItems(queryClient, (feedItems) =>
		feedItems.map((feedItem) =>
			feedItem.id === id ? { ...feedItem, reactions: updateReactions(feedItem.reactions) } : feedItem,
		),
	);
};

/** 피드 목록 조회 Hook에 사용할 옵션 */
export const getFeedItemListOptions = ({ country }: CountryParams) =>
	infiniteQueryOptions({
		queryKey: feedKeys.list(country),
		queryFn: ({ pageParam }) => getFeedItemList({ cursor: pageParam, country }),
		initialPageParam: null as string | null,
		getNextPageParam: (lastPage) => lastPage.meta.next_cursor ?? undefined,
	});
/** 피드 목록 조회 Hook */
export const useGetFeedItemList = ({ country }: CountryParams) => {
	return useSuspenseInfiniteQuery(getFeedItemListOptions({ country }));
};

/** 반응 종류 목록 조회 Hook에 사용할 옵션 */
export const getFeedReactionTypeListOptions = () =>
	queryOptions({ queryKey: feedKeys.reactionTypes(), queryFn: getFeedReactionTypeList });
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
			await queryClient.cancelQueries({ queryKey: feedKeys.all() });

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
			await queryClient.cancelQueries({ queryKey: feedKeys.all() });

			updateCachedFeedItemReactions(queryClient, id, (reactions) => withoutMyReaction(reactions, reactionTypeId));
		},
		onSuccess: (reactions, { id }) => updateCachedFeedItemReactions(queryClient, id, () => reactions),
		onError: (error, { id, reactionTypeId }) => {
			updateCachedFeedItemReactions(queryClient, id, (reactions) => withMyReaction(reactions, reactionTypeId));

			reportError(error, 'feed_reaction_delete');
		},
	});
};
