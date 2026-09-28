import type { NotificationSettings, Settings } from '@/types/apis/settings';

import type { SleepSettings } from '@/types/sleep-settings';

import { useGetSettings, useUpdateNotificationSettings, useUpdateSleepSettings } from '@/hooks/apis/settings';

export function useSettingsUpdate(): {
	settings: Settings;
	updateSleep(sleep: SleepSettings): void;
	updateNotifications(notifications: NotificationSettings): void;
	saveFailed: boolean;
} {
	const { data: settingsData } = useGetSettings();

	const updateSleepSettings = useUpdateSleepSettings();
	const updateNotificationSettings = useUpdateNotificationSettings();

	return {
		settings: settingsData,
		updateSleep: (sleep) => updateSleepSettings.mutate({ data: sleep }),
		updateNotifications: (notifications) => updateNotificationSettings.mutate({ data: notifications }),
		saveFailed: updateSleepSettings.isError || updateNotificationSettings.isError,
	};
}
