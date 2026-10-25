import {
	type NotificationSettingList,
	notificationSettingListSchema,
	type PatchCommunitySettingsParams,
	type PatchNotificationSettingItemParams,
	type PatchPushSettingParams,
	type PutSleepSettingsParams,
	type Settings,
	settingsSchema,
} from '@/types/apis/settings';

import { apiRequest } from '@/lib/api';

import { z } from 'zod';

export const getSettings = async (): Promise<Settings> => {
	const { data: settings } = await apiRequest('/api/v1/users/me/settings', settingsSchema);

	return settings;
};

export const putSleepSettings = async ({ data, idempotencyKey }: PutSleepSettingsParams): Promise<Settings> => {
	const { data: settings } = await apiRequest('/api/v1/users/me/settings/sleep', settingsSchema, {
		method: 'PUT',
		json: data,
		idempotencyKey,
	});

	return settings;
};

export const patchCommunitySettings = async ({ data, idempotencyKey }: PatchCommunitySettingsParams): Promise<void> => {
	await apiRequest('/api/v1/users/me/settings/community', z.unknown(), {
		method: 'PATCH',
		json: data,
		idempotencyKey,
	});
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
}: PatchPushSettingParams): Promise<NotificationSettingList> => {
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
}: PatchNotificationSettingItemParams): Promise<NotificationSettingList> => {
	const { data: notificationSettings } = await apiRequest(
		`/api/v1/users/me/settings/notifications/${id}`,
		notificationSettingListSchema,
		{ method: 'PATCH', json: data, idempotencyKey },
	);

	return notificationSettings;
};
