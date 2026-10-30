import {
	type FeedItemLike,
	feedItemLikeSchema,
	feedItemListSchema,
	feedMetaSchema,
	type FeedPage,
	type GetFeedItemListParams,
	type PostFeedItemParams,
} from '@/types/apis/feed';

import { apiRequest } from '@/lib/api';

import { z } from 'zod';

export const getFeedItemList = async ({ cursor, country }: GetFeedItemListParams): Promise<FeedPage> => {
	const { data, meta } = await apiRequest('/api/v1/feed', feedItemListSchema, {
		searchParams: { cursor: cursor ?? undefined, country: country ?? undefined },
	});

	return { data, meta: feedMetaSchema.parse(meta) };
};

export const postFeedItem = async ({ data, idempotencyKey }: PostFeedItemParams): Promise<void> => {
	await apiRequest('/api/v1/feed', z.unknown(), { method: 'POST', json: data, idempotencyKey });
};

export const putFeedItemLike = async ({
	id,
	idempotencyKey,
}: {
	id: string;
	idempotencyKey: string;
}): Promise<FeedItemLike> => {
	const { data: like } = await apiRequest(`/api/v1/feed/${id}/like`, feedItemLikeSchema, {
		method: 'PUT',
		idempotencyKey,
	});

	return like;
};

export const deleteFeedItemLike = async ({
	id,
	idempotencyKey,
}: {
	id: string;
	idempotencyKey: string;
}): Promise<FeedItemLike> => {
	const { data: like } = await apiRequest(`/api/v1/feed/${id}/like`, feedItemLikeSchema, {
		method: 'DELETE',
		idempotencyKey,
	});

	return like;
};
