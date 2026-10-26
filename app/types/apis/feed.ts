import { publicFileSchema } from '@/types/apis/common';
import { timestampSchema, uuidSchema } from '@/types/apis/primitives';
import { communityUserSchema } from '@/types/apis/users';

import { z } from 'zod';

export const feedItemLikeSchema = z.object({
	like_count: z.number().int(),
	is_liked: z.boolean(),
});

export const feedItemSchema = z.object({
	id: uuidSchema,
	kind: z.string(),
	created_at: timestampSchema,
	user: communityUserSchema,
	word_name: z.string().nullable(),
	file: publicFileSchema.nullable(),
	threshold: z.number().int().nullable(),
	like_count: z.number().int(),
	is_liked: z.boolean(),
});

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
