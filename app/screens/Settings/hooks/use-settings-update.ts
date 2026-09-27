import { useQuery } from "@tanstack/react-query"

import {
	settingsQueryOptions,
	updateNotificationsMutationOptions,
	updateSleepMutationOptions,
} from "@/hooks/apis/settings"
import { useIdempotentMutation } from "@/hooks/apis/use-idempotent-mutation"
import type { NotificationSettings, Settings } from "@/types/apis/settings"
import type { SleepSettings } from "@/types/sleep-settings"

export function useSettingsUpdate(): {
	settings: Settings | undefined
	loadFailed: boolean
	retry(): void
	updateSleep(sleep: SleepSettings): void
	updateNotifications(notifications: NotificationSettings): void
	saveFailed: boolean
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
		saveFailed: sleepMutation.isError || notificationsMutation.isError,
	}
}
