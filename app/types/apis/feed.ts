import { publicFileSchema } from '@/types/apis/common';
import { timestampSchema, uuidSchema } from '@/types/apis/primitives';
import { communityUserSchema } from '@/types/apis/users';

import { z } from 'zod';

export const feedItemLikeSchema = z.object({
	like_count: z.number().int(),
	is_liked: z.boolean(),
});

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

const feedAdItemSchema = z.object({
	id: uuidSchema,
	kind: z.literal('ad'),
	serve_id: uuidSchema,
	is_ad: z.boolean(),
	advertiser_name: z.string(),
	advertiser_description: z.string().nullable(),
	advertiser_photo_file: publicFileSchema,
	link_url: z.string(),
	body: z.string(),
	image_file: publicFileSchema,
	button_text: z.string(),
	button_color: z.string(),
	button_text_color: z.string(),
});

const feedListItemSchema = z.discriminatedUnion('kind', [feedItemSchema, feedAdItemSchema]);

const knownFeedItemKinds: string[] = [...feedItemSchema.options, feedAdItemSchema].map(
	(option) => option.shape.kind.value,
);

const positionedFeedItemSchema = z.object({ feedItem: feedListItemSchema, position: z.number().int().nonnegative() });

export const feedItemListSchema = z
	.array(z.looseObject({ kind: z.string() }))
	.transform((feedItems) =>
		feedItems
			.map((feedItem, position) => ({ feedItem, position }))
			.filter(
				({ feedItem }) =>
					knownFeedItemKinds.includes(feedItem.kind) &&
					(feedItem.kind !== 'ad' || feedAdItemSchema.safeParse(feedItem).success),
			),
	)
	.pipe(z.array(positionedFeedItemSchema));

export const feedMetaSchema = z.object({ next_cursor: uuidSchema.nullable() });

export type FeedItem = z.infer<typeof feedItemSchema>;
export type FeedAdItem = z.infer<typeof feedAdItemSchema>;
export type PositionedFeedItem = z.infer<typeof positionedFeedItemSchema>;
export type FeedItemLike = z.infer<typeof feedItemLikeSchema>;

export interface FeedPage {
	data: PositionedFeedItem[];
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
