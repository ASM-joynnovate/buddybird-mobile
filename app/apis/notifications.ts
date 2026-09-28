import { type Page, pageMetaSchema } from '@/types/apis/common';
import { type AppNotification, notificationSchema } from '@/types/apis/notifications';

import { z } from 'zod';

import { mockServer } from '@/mocks/server';

export async function fetchNotifications(page: number): Promise<Page<AppNotification>> {
	const { data, meta } = await mockServer.notifications.list(page);

	return { data: z.array(notificationSchema).parse(data), meta: pageMetaSchema.parse(meta) };
}

export async function markNotificationRead(id: string, _idempotencyKey: string): Promise<void> {
	await mockServer.notifications.read(id);
}

export async function markAllNotificationsRead(_idempotencyKey: string): Promise<void> {
	await mockServer.notifications.readAll();
}
