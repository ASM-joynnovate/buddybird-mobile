import { useMutation, useQuery } from "@tanstack/react-query"
import { randomUUID } from "expo-crypto"

import {
	settingsQueryOptions,
	updateNotificationsMutationOptions,
	updateSleepMutationOptions,
} from "@/hooks/apis/settings"
import type { NotificationSettings, Settings, SleepSettings } from "@/types/apis/settings"

export function useSettingsUpdate(): {
	settings: Settings | undefined
	loadFailed: boolean
	retry(): void
	updateSleep(sleep: SleepSettings): void
	updateNotifications(notifications: NotificationSettings): void
	failed: boolean
} {
	const query = useQuery(settingsQueryOptions())
	const sleepMutation = useMutation(updateSleepMutationOptions())
	const notificationsMutation = useMutation(updateNotificationsMutationOptions())

	return {
		settings: query.data,
		loadFailed: query.isError,
		retry: () => void query.refetch(),
		updateSleep: (sleep) => sleepMutation.mutate({ sleep, idempotencyKey: randomUUID() }),
		updateNotifications: (notifications) =>
			notificationsMutation.mutate({ notifications, idempotencyKey: randomUUID() }),
		failed: sleepMutation.isError || notificationsMutation.isError,
	}
}
