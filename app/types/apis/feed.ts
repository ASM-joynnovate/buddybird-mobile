import { publicFileSchema } from '@/types/apis/common';
import { timestampSchema, uuidSchema } from '@/types/apis/primitives';
import { communityUserSchema } from '@/types/apis/users';

import { z } from 'zod';

export const feedItemReactionSchema = z.object({
	reaction_type_id: uuidSchema,
	count: z.number().int(),
	is_mine: z.boolean(),
});

export const feedItemSchema = z.object({
	id: uuidSchema,
	kind: z.string(),
	created_at: timestampSchema,
	user: communityUserSchema,
	word_name: z.string().nullable(),
	file: publicFileSchema.nullable(),
	threshold: z.number().int().nullable(),
	reactions: z.array(feedItemReactionSchema),
});

export const feedMetaSchema = z.object({ next_cursor: uuidSchema.nullable() });

export const feedReactionTypeSchema = z.object({
	id: uuidSchema,
	name: z.string(),
	image_file: publicFileSchema,
});

export type FeedItem = z.infer<typeof feedItemSchema>;
export type FeedItemReaction = z.infer<typeof feedItemReactionSchema>;
export type FeedReactionType = z.infer<typeof feedReactionTypeSchema>;

export interface FeedPage {
	data: FeedItem[];
	meta: z.infer<typeof feedMetaSchema>;
}
