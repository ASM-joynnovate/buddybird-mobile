import {
	type FeedItemReaction,
	type FeedPage,
	type FeedReactionType,
	feedItemReactionSchema,
	feedItemSchema,
	feedMetaSchema,
	feedReactionTypeSchema,
} from '@/types/apis/feed';

import { apiRequest } from '@/lib/api';

import { z } from 'zod';

export const getFeedItemList = async ({
	cursor,
	country,
}: {
	cursor: string | null;
	country: string | null;
}): Promise<FeedPage> => {
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
}: {
	id: string;
	reactionTypeId: string;
	idempotencyKey: string;
}): Promise<FeedItemReaction[]> => {
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
}: {
	id: string;
	reactionTypeId: string;
	idempotencyKey: string;
}): Promise<FeedItemReaction[]> => {
	const { data: reactions } = await apiRequest(
		`/api/v1/feed/${id}/reactions/${reactionTypeId}`,
		z.array(feedItemReactionSchema),
		{ method: 'DELETE', idempotencyKey },
	);

	return reactions;
};
