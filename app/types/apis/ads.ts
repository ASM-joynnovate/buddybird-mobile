import { publicFileSchema } from '@/types/apis/common';
import { uuidSchema } from '@/types/apis/primitives';

import { z } from 'zod';

export const bannerAdSchema = z.object({
	id: uuidSchema,
	serve_id: uuidSchema,
	is_ad: z.boolean(),
	advertiser_name: z.string(),
	link_url: z.string(),
	image_file: publicFileSchema,
	ad_tag_color: z.string().nullable(),
});

export type AdKind = 'home_banner';
export type AdEventKind = 'impression' | 'click';
export type AdClickTarget = 'image' | 'button' | 'profile' | 'background';
export type BannerAd = z.infer<typeof bannerAdSchema>;

export interface AdEvent {
	ad_id: string;
	serve_id: string;
	kind: AdEventKind;
	position: number;
	click_target: AdClickTarget | null;
	visible_duration_ms: number | null;
	occurred_at: string;
}

export interface GetAdListParams {
	kind: AdKind;
}

export interface PostAdEventsParams {
	data: { events: AdEvent[] };
}
