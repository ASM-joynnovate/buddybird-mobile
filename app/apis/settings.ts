import {
	type NotificationSettingList,
	notificationSettingListSchema,
	type Settings,
	settingsSchema,
	type UpdateNotificationSettingItemRequest,
	type UpdatePushSettingRequest,
} from '@/types/apis/settings';

import { apiRequest } from '@/lib/api';

export const getSettings = async (): Promise<Settings> => {
	const { data: settings } = await apiRequest('/api/v1/users/me/settings', settingsSchema);

	return settings;
};

export const putSleepSettings = async ({
	data,
	idempotencyKey,
}: {
	data: Settings['sleep'];
	idempotencyKey: string;
}): Promise<Settings> => {
	const { data: settings } = await apiRequest('/api/v1/users/me/settings/sleep', settingsSchema, {
		method: 'PUT',
		json: data,
		idempotencyKey,
	});

	return settings;
};

export const getNotificationSettings = async (): Promise<NotificationSettingList> => {
	const { data: notificationSettings } = await apiRequest(
		'/api/v1/users/me/settings/notifications',
		notificationSettingListSchema,
	);

	return notificationSettings;
};

export const patchPushSetting = async ({
	data,
	idempotencyKey,
}: {
	data: UpdatePushSettingRequest;
	idempotencyKey: string;
}): Promise<NotificationSettingList> => {
	const { data: notificationSettings } = await apiRequest(
		'/api/v1/users/me/settings/notifications',
		notificationSettingListSchema,
		{ method: 'PATCH', json: data, idempotencyKey },
	);

	return notificationSettings;
};

export const patchNotificationSettingItem = async ({
	id,
	data,
	idempotencyKey,
}: {
	id: string;
	data: UpdateNotificationSettingItemRequest;
	idempotencyKey: string;
}): Promise<NotificationSettingList> => {
	const { data: notificationSettings } = await apiRequest(
		`/api/v1/users/me/settings/notifications/${id}`,
		notificationSettingListSchema,
		{ method: 'PATCH', json: data, idempotencyKey },
	);

	return notificationSettings;
};
