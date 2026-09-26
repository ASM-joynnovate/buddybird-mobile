import { mutationOptions, queryOptions } from "@tanstack/react-query"

import { fetchSettings, updateNotifications, updateSleep } from "@/apis/settings"
import { invalidate } from "@/hooks/apis/invalidate"
import { apiKeys } from "@/hooks/apis/keys"
import { queryClient } from "@/lib/query-client"
import type { NotificationSettings, Settings, SleepSettings } from "@/types/apis/settings"

async function patchCachedSettings(patch: Partial<Settings>) {
	await queryClient.cancelQueries({ queryKey: apiKeys.settings() })

	const previous = queryClient.getQueryData<Settings>(apiKeys.settings())

	if (previous) {
		queryClient.setQueryData(apiKeys.settings(), { ...previous, ...patch })
	}

	return { previous }
}

function restoreCachedSettings(context: { previous: Settings | undefined } | undefined) {
	if (context?.previous) {
		queryClient.setQueryData(apiKeys.settings(), context.previous)
	}
}

export const settingsQueryOptions = () =>
	queryOptions({ queryKey: apiKeys.settings(), queryFn: fetchSettings })

export const updateSleepMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("users", "me", "settings", "sleep"),
		mutationFn: ({ sleep, idempotencyKey }: { sleep: SleepSettings; idempotencyKey: string }) =>
			updateSleep(sleep, idempotencyKey),
		onMutate: ({ sleep }) => patchCachedSettings({ sleep }),
		onError: (_error, _variables, context) => restoreCachedSettings(context),
		onSettled: () => invalidate(apiKeys.settings(), apiKeys.sessions.running(), apiKeys.home()),
	})

export const updateNotificationsMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("users", "me", "settings", "notifications"),
		mutationFn: ({
			notifications,
			idempotencyKey,
		}: {
			notifications: NotificationSettings
			idempotencyKey: string
		}) => updateNotifications(notifications, idempotencyKey),
		onMutate: ({ notifications }) => patchCachedSettings({ notifications }),
		onError: (_error, _variables, context) => restoreCachedSettings(context),
		onSettled: () => invalidate(apiKeys.settings(), apiKeys.sessions.running(), apiKeys.home()),
	})
