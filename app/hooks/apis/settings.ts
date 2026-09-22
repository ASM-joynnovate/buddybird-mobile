import { mutationOptions, queryOptions } from "@tanstack/react-query"

import { fetchSettings, type Settings, updateSettings } from "@/apis/settings"
import { apiKeys } from "@/hooks/apis/keys"
import { queryClient } from "@/lib/query-client"

export const settingsQueryOptions = () =>
	queryOptions({ queryKey: apiKeys.settings(), queryFn: fetchSettings })

export const updateSettingsMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("users", "me", "settings"),
		mutationFn: ({
			patch,
			idempotencyKey,
		}: {
			patch: Partial<Settings>
			idempotencyKey: string
		}) => updateSettings(patch, idempotencyKey),
		onMutate: async ({ patch }) => {
			await queryClient.cancelQueries({ queryKey: apiKeys.settings() })

			const previous = queryClient.getQueryData<Settings>(apiKeys.settings())

			if (previous) {
				queryClient.setQueryData(apiKeys.settings(), { ...previous, ...patch })
			}

			return { previous }
		},
		onError: (_error, _variables, context) => {
			if (context?.previous) {
				queryClient.setQueryData(apiKeys.settings(), context.previous)
			}
		},
		onSettled: () =>
			Promise.all([
				queryClient.invalidateQueries({ queryKey: apiKeys.settings() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.sessions.running() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.home() }),
			]),
	})
