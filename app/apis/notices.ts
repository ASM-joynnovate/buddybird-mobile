import { type Page, pageMetaSchema } from '@/types/apis/common';
import { type Notice, noticeSchema } from '@/types/apis/notices';

import { z } from 'zod';

import { mockServer } from '@/mocks/server';

export const getNoticeList = async ({ page }: { page: number }): Promise<Page<Notice>> => {
	const { data, meta } = await mockServer.notices.list(page);

	return { data: z.array(noticeSchema).parse(data), meta: pageMetaSchema.parse(meta) };
};

export const getNotice = async ({ id }: { id: string }): Promise<Notice> => {
	return noticeSchema.parse(await mockServer.notices.get(id));
};

export const postNoticeRead = async ({
	id,
	idempotencyKey,
}: {
	id: string;
	idempotencyKey: string;
}): Promise<Notice> => {
	return noticeSchema.parse(await mockServer.notices.read(id));
};
