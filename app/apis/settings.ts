import { type NotificationSettings, type Settings, settingsSchema } from '@/types/apis/settings';

import { mockServer } from '@/mocks/server';

export const getSettings = async (): Promise<Settings> => {
	return settingsSchema.parse(await mockServer.settings.get());
};

export const putSleepSettings = async ({
	data,
	idempotencyKey,
}: {
	data: Settings['sleep'];
	idempotencyKey: string;
}): Promise<Settings> => {
	return settingsSchema.parse(await mockServer.settings.updateSleep(data));
};

export const putNotificationSettings = async ({
	data,
	idempotencyKey,
}: {
	data: NotificationSettings;
	idempotencyKey: string;
}): Promise<Settings> => {
	return settingsSchema.parse(await mockServer.settings.updateNotifications(data));
};
