import { type NotificationSettings, type Settings, settingsSchema } from '@/types/apis/settings';

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

export const putNotificationSettings = async ({
	data,
	idempotencyKey,
}: {
	data: NotificationSettings;
	idempotencyKey: string;
}): Promise<Settings> => {
	const { data: settings } = await apiRequest('/api/v1/users/me/settings/notifications', settingsSchema, {
		method: 'PUT',
		json: data,
		idempotencyKey,
	});

	return settings;
};
