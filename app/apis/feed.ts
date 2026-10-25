import {
	type FeedItemReaction,
	feedItemReactionSchema,
	feedItemSchema,
	feedMetaSchema,
	type FeedPage,
	type FeedReactionParams,
	type FeedReactionType,
	feedReactionTypeSchema,
	type GetFeedItemListParams,
} from '@/types/apis/feed';

import { apiRequest } from '@/lib/api';

import { z } from 'zod';

export const getFeedItemList = async ({ cursor, country }: GetFeedItemListParams): Promise<FeedPage> => {
	const { data, meta } = await apiRequest('/api/v1/feed', z.array(feedItemSchema), {
		searchParams: { cursor: cursor ?? undefined, country: country ?? undefined },
	});

	return { data, meta: feedMetaSchema.parse(meta) };
};

export const getFeedReactionTypeList = async (): Promise<FeedReactionType[]> => {
	const { data: reactionTypes } = await apiRequest('/api/v1/feed/reaction-types', z.array(feedReactionTypeSchema));

	return reactionTypes;
};

export const putFeedReaction = async ({
	id,
	reactionTypeId,
	idempotencyKey,
}: FeedReactionParams): Promise<FeedItemReaction[]> => {
	const { data: reactions } = await apiRequest(
		`/api/v1/feed/${id}/reactions/${reactionTypeId}`,
		z.array(feedItemReactionSchema),
		{ method: 'PUT', idempotencyKey },
	);

	return reactions;
};

export const deleteFeedReaction = async ({
	id,
	reactionTypeId,
	idempotencyKey,
}: FeedReactionParams): Promise<FeedItemReaction[]> => {
	const { data: reactions } = await apiRequest(
		`/api/v1/feed/${id}/reactions/${reactionTypeId}`,
		z.array(feedItemReactionSchema),
		{ method: 'DELETE', idempotencyKey },
	);

	return reactions;
};
