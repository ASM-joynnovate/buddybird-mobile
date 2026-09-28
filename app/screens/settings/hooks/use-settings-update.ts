import { useQuery } from '@tanstack/react-query';

import type { NotificationSettings, Settings } from '@/types/apis/settings';

import type { SleepSettings } from '@/types/sleep-settings';

import { getSettingsOptions, useUpdateNotificationSettings, useUpdateSleepSettings } from '@/hooks/apis/settings';

export function useSettingsUpdate(): {
	settings: Settings | undefined;
	loadFailed: boolean;
	retry(): void;
	updateSleep(sleep: SleepSettings): void;
	updateNotifications(notifications: NotificationSettings): void;
	saveFailed: boolean;
} {
	const { data: settingsData, isError, refetch } = useQuery(getSettingsOptions());

	const updateSleepSettings = useUpdateSleepSettings();
	const updateNotificationSettings = useUpdateNotificationSettings();

	return {
		settings: settingsData,
		loadFailed: isError,
		retry: () => void refetch(),
		updateSleep: (sleep) => updateSleepSettings.mutate({ data: sleep }),
		updateNotifications: (notifications) => updateNotificationSettings.mutate({ data: notifications }),
		saveFailed: updateSleepSettings.isError || updateNotificationSettings.isError,
	};
}
