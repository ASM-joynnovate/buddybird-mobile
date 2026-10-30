import { type BannerAd, bannerAdListSchema, type GetAdListParams, type PostAdEventsParams } from '@/types/apis/ads';

import { apiRequest } from '@/lib/api';

import { z } from 'zod';

export const getAdList = async ({ kind }: GetAdListParams): Promise<BannerAd[]> => {
	const { data: bannerAds } = await apiRequest('/api/v1/ads', bannerAdListSchema, { searchParams: { kind } });

	return bannerAds;
};

export const postAdEvents = async ({ data }: PostAdEventsParams): Promise<void> => {
	await apiRequest('/api/v1/ads/events', z.unknown(), { method: 'POST', json: data });
};
