import { type Page, pageMetaSchema } from '@/types/apis/common';
import { type AppNotification, notificationSchema } from '@/types/apis/notifications';

import { z } from 'zod';

import { mockServer } from '@/mocks/server';

export const getNotificationList = async ({ page }: { page: number }): Promise<Page<AppNotification>> => {
	const { data, meta } = await mockServer.notifications.list(page);

	return { data: z.array(notificationSchema).parse(data), meta: pageMetaSchema.parse(meta) };
};

export const postNotificationRead = async ({
	id,
	idempotencyKey,
}: {
	id: string;
	idempotencyKey: string;
}): Promise<void> => {
	await mockServer.notifications.read(id);
};

export const postAllNotificationsRead = async ({ idempotencyKey }: { idempotencyKey: string }): Promise<void> => {
	await mockServer.notifications.readAll();
};
