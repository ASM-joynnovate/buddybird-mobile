import { type Page, pageMetaSchema } from '@/types/apis/common';
import { type AppNotification, notificationSchema } from '@/types/apis/notifications';

import { apiRequest } from '@/lib/api';

import { z } from 'zod';

export const getNotificationList = async ({ page }: { page: number }): Promise<Page<AppNotification>> => {
	const { data, meta } = await apiRequest('/api/v1/notifications', z.array(notificationSchema), {
		searchParams: { page },
	});

	return { data, meta: pageMetaSchema.parse(meta) };
};

export const getNotification = async ({ id }: { id: string }): Promise<AppNotification> => {
	const { data: notification } = await apiRequest(`/api/v1/notifications/${id}`, notificationSchema);

	return notification;
};

export const postNotificationRead = async ({
	id,
	idempotencyKey,
}: {
	id: string;
	idempotencyKey: string;
}): Promise<void> => {
	await apiRequest(`/api/v1/notifications/${id}/read`, z.unknown(), { method: 'POST', idempotencyKey });
};

export const postAllNotificationsRead = async ({ idempotencyKey }: { idempotencyKey: string }): Promise<void> => {
	await apiRequest('/api/v1/notifications/read-all', z.unknown(), { method: 'POST', idempotencyKey });
};
