import { useQuery } from "@tanstack/react-query"

import {
	settingsQueryOptions,
	updateNotificationsMutationOptions,
	updateSleepMutationOptions,
} from "@/hooks/apis/settings"
import { useIdempotentMutation } from "@/hooks/apis/use-idempotent-mutation"
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

	const sleepMutation = useIdempotentMutation(updateSleepMutationOptions())
	const notificationsMutation = useIdempotentMutation(updateNotificationsMutationOptions())

	return {
		settings: query.data,
		loadFailed: query.isError,
		retry: () => void query.refetch(),
		updateSleep: (sleep) => sleepMutation.mutate({ sleep }),
		updateNotifications: (notifications) => notificationsMutation.mutate({ notifications }),
		failed: sleepMutation.isError || notificationsMutation.isError,
	}
}
