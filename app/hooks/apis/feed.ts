import {
	type InfiniteData,
	infiniteQueryOptions,
	type QueryClient,
	useQueryClient,
	useSuspenseInfiniteQuery,
} from '@tanstack/react-query';

import { deleteFeedItemLike, getFeedItemList, postFeedItem, putFeedItemLike } from '@/apis/feed';

import type { CountryParams } from '@/types/apis/common';
import type { FeedItemLike, FeedListItem, FeedPage } from '@/types/apis/feed';

import { apiKeys } from '@/hooks/apis/keys';
import { feedKeys } from '@/hooks/apis/keys/feed';
import { sessionKeys } from '@/hooks/apis/keys/sessions';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { reportError } from '@/services/telemetry/client';

/** 피드 목록 캐시의 피드 항목을 변경하는 함수 */
export const updateCachedFeedItems = (
	queryClient: QueryClient,
	updateFeedItems: (feedItems: FeedListItem[]) => FeedListItem[],
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

/** 캐시의 피드 항목 좋아요 여부 변경 함수 */
const setCachedFeedItemLiked = (queryClient: QueryClient, id: string, isLiked: boolean) => {
	updateCachedFeedItems(queryClient, (feedItems) =>
		feedItems.map((feedItem) =>
			feedItem.kind !== 'ad' && feedItem.id === id && feedItem.is_liked !== isLiked
				? { ...feedItem, is_liked: isLiked, like_count: feedItem.like_count + (isLiked ? 1 : -1) }
				: feedItem,
		),
	);
};

/** 캐시의 피드 항목 좋아요 상태를 응답으로 교체하는 함수 */
const replaceCachedFeedItemLike = (queryClient: QueryClient, id: string, like: FeedItemLike) => {
	updateCachedFeedItems(queryClient, (feedItems) =>
		feedItems.map((feedItem) =>
			feedItem.kind !== 'ad' && feedItem.id === id ? { ...feedItem, ...like } : feedItem,
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

/** 피드에 공유 Hook */
export const useShareToFeed = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('feed', 'create'),
		mutationFn: postFeedItem,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.all() }),
	});
};

/** 좋아요 Hook */
export const useLikeFeedItem = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('feed', 'like'),
		mutationFn: putFeedItemLike,
		onMutate: async ({ id }) => {
			await queryClient.cancelQueries({ queryKey: feedKeys.all() });

			setCachedFeedItemLiked(queryClient, id, true);
		},
		onSuccess: (like, { id }) => replaceCachedFeedItemLike(queryClient, id, like),
		onError: (error, { id }) => {
			setCachedFeedItemLiked(queryClient, id, false);

			reportError(error, 'feed_like');
		},
	});
};

/** 좋아요 취소 Hook */
export const useUnlikeFeedItem = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('feed', 'unlike'),
		mutationFn: deleteFeedItemLike,
		onMutate: async ({ id }) => {
			await queryClient.cancelQueries({ queryKey: feedKeys.all() });

			setCachedFeedItemLiked(queryClient, id, false);
		},
		onSuccess: (like, { id }) => replaceCachedFeedItemLike(queryClient, id, like),
		onError: (error, { id }) => {
			setCachedFeedItemLiked(queryClient, id, true);

			reportError(error, 'feed_unlike');
		},
	});
};
