import { publicFileSchema } from '@/types/apis/common';
import { timestampSchema, uuidSchema } from '@/types/apis/primitives';
import { communityUserSchema } from '@/types/apis/users';

import { z } from 'zod';

export const feedItemLikeSchema = z.object({
	like_count: z.number().int(),
	is_liked: z.boolean(),
});

const feedItemKindSchema = z.enum([
	'mimic_succeeded',
	'total_learning_time_reached',
	'monthly_learning_time_reached',
	'word_play_count_reached',
]);

const feedItemBaseSchema = z.object({
	id: uuidSchema,
	created_at: timestampSchema,
	user: communityUserSchema,
	word_name: z.string().nullable(),
	file: publicFileSchema.nullable(),
	threshold: z.number().int().nullable(),
	like_count: z.number().int(),
	is_liked: z.boolean(),
});

const feedItemSchema = z.discriminatedUnion('kind', [
	feedItemBaseSchema.extend({ kind: z.literal('mimic_succeeded') }),
	feedItemBaseSchema.extend({ kind: z.literal('total_learning_time_reached') }),
	feedItemBaseSchema.extend({ kind: z.literal('monthly_learning_time_reached') }),
	feedItemBaseSchema.extend({ kind: z.literal('word_play_count_reached') }),
]);

export const feedItemListSchema = z
	.array(z.looseObject({ kind: z.string() }))
	.transform((feedItems) => feedItems.filter((feedItem) => feedItemKindSchema.safeParse(feedItem.kind).success))
	.pipe(z.array(feedItemSchema));

export const feedMetaSchema = z.object({ next_cursor: uuidSchema.nullable() });

export type FeedItem = z.infer<typeof feedItemSchema>;
export type FeedItemLike = z.infer<typeof feedItemLikeSchema>;

export interface FeedPage {
	data: FeedItem[];
	meta: z.infer<typeof feedMetaSchema>;
}

export interface GetFeedItemListParams {
	cursor: string | null;
	country: string | null;
}

export interface CreateFeedItemRequest {
	session_sound_id: string;
}

export interface PostFeedItemParams {
	data: CreateFeedItemRequest;
	idempotencyKey: string;
}
