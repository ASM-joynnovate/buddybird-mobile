import { publicFileSchema } from '@/types/apis/common';
import { timestampSchema, uuidSchema } from '@/types/apis/primitives';

import { z } from 'zod';

const adKindSchema = z.enum(['home_banner']);

const adClickTargetSchema = z.enum(['image', 'button', 'profile', 'background']);

const bannerAdSchema = z.object({
	id: uuidSchema,
	serve_id: uuidSchema,
	is_ad: z.boolean(),
	advertiser_name: z.string(),
	link_url: z.string(),
	image_file: publicFileSchema,
});

export const bannerAdListSchema = z
	.array(z.looseObject({}))
	.transform((bannerAds) => bannerAds.filter((bannerAd) => bannerAdSchema.safeParse(bannerAd).success))
	.pipe(z.array(bannerAdSchema));

const createAdEventsRequestSchema = z.object({
	events: z
		.array(
			z.object({
				ad_id: uuidSchema,
				serve_id: uuidSchema,
				kind: z.enum(['impression', 'click']),
				position: z.number().int().nonnegative(),
				click_target: adClickTargetSchema.nullable(),
				visible_duration_ms: z.number().int().nonnegative().nullable(),
				occurred_at: timestampSchema,
			}),
		)
		.max(500),
});

export type AdKind = z.infer<typeof adKindSchema>;
export type AdClickTarget = z.infer<typeof adClickTargetSchema>;
export type BannerAd = z.infer<typeof bannerAdSchema>;
export type CreateAdEventsRequest = z.infer<typeof createAdEventsRequestSchema>;
export type AdEvent = CreateAdEventsRequest['events'][number];

export interface GetAdListParams {
	kind: AdKind;
}

export interface PostAdEventsParams {
	data: CreateAdEventsRequest;
}
