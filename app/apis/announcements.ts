import { type Announcement, announcementSchema } from '@/types/apis/announcements';
import { type Page, pageMetaSchema, type PageParams } from '@/types/apis/common';

import { apiRequest } from '@/lib/api';

import { z } from 'zod';

export const getAnnouncementList = async ({ page }: PageParams): Promise<Page<Announcement>> => {
	const { data, meta } = await apiRequest('/api/v1/announcements', z.array(announcementSchema), {
		searchParams: { page },
	});

	return { data, meta: pageMetaSchema.parse(meta) };
};

export const getAnnouncement = async ({ id }: { id: string }): Promise<Announcement> => {
	const { data: announcement } = await apiRequest(`/api/v1/announcements/${id}`, announcementSchema);

	return announcement;
};

export const postAnnouncementRead = async ({
	id,
	idempotencyKey,
}: {
	id: string;
	idempotencyKey: string;
}): Promise<Announcement> => {
	const { data: announcement } = await apiRequest(`/api/v1/announcements/${id}/read`, announcementSchema, {
		method: 'POST',
		idempotencyKey,
	});

	return announcement;
};
