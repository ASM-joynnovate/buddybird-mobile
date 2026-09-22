import { useMutation, useQuery } from "@tanstack/react-query"
import { randomUUID } from "expo-crypto"

import type { Settings } from "@/apis/settings"
import { settingsQueryOptions, updateSettingsMutationOptions } from "@/hooks/apis/settings"

export function useSettingsUpdate(): {
	settings: Settings | undefined
	loadFailed: boolean
	retry(): void
	update(patch: Partial<Settings>): void
	failed: boolean
} {
	const query = useQuery(settingsQueryOptions())
	const mutation = useMutation(updateSettingsMutationOptions())

	return {
		settings: query.data,
		loadFailed: query.isError,
		retry: () => void query.refetch(),
		update: (patch) => mutation.mutate({ patch, idempotencyKey: randomUUID() }),
		failed: mutation.isError,
	}
}
