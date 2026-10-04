import { type Page, pageMetaSchema } from '@/types/apis/common';
import { type Notice, noticeSchema } from '@/types/apis/notices';

import { apiRequest } from '@/lib/api';

import { z } from 'zod';

export const getNoticeList = async ({ page }: { page: number }): Promise<Page<Notice>> => {
	const { data, meta } = await apiRequest('/api/v1/notices', z.array(noticeSchema), { searchParams: { page } });

	return { data, meta: pageMetaSchema.parse(meta) };
};

export const getNotice = async ({ id }: { id: string }): Promise<Notice> => {
	const { data: notice } = await apiRequest(`/api/v1/notices/${id}`, noticeSchema);

	return notice;
};

export const postNoticeRead = async ({
	id,
	idempotencyKey,
}: {
	id: string;
	idempotencyKey: string;
}): Promise<Notice> => {
	const { data: notice } = await apiRequest(`/api/v1/notices/${id}/read`, noticeSchema, {
		method: 'POST',
		idempotencyKey,
	});

	return notice;
};
