import { useQuery } from "@tanstack/react-query"

import { runningSessionQueryOptions } from "@/hooks/apis/sessions"
import { settingsQueryOptions } from "@/hooks/apis/settings"
import { wordsQueryOptions } from "@/hooks/apis/words"
import { useDevices } from "@/hooks/use-devices"
import type { Session } from "@/types/apis/sessions"
import type { SleepSettings } from "@/types/apis/settings"
import type { LinkedDevice } from "@/types/device"

export type RunningSessionDetail = {
	session: Session
	wordName: string | null
	station: LinkedDevice | null
	sleep: SleepSettings
}

export function useRunningSession(refetchInterval: number | false = false): {
	detail: RunningSessionDetail | null
	sessionId: string | null
	loading: boolean
	isError: boolean
	isSuccess: boolean
	retry(): void
} {
	const running = useQuery({ ...runningSessionQueryOptions(), refetchInterval })
	const session = running.data ?? null

	const words = useQuery(wordsQueryOptions())
	const settings = useQuery(settingsQueryOptions())
	const devices = useDevices()

	const detail =
		session && settings.data
			? {
					session,
					wordName:
						words.data?.find((word) => word.id === session.settings.word_id)?.name ??
						null,
					station:
						devices.devices?.find(
							(device) => device.id === session.station.device_id,
						) ?? null,
					sleep: settings.data.sleep,
				}
			: null

	return {
		detail,
		sessionId: session?.id ?? null,
		loading: running.isPending || (session !== null && !settings.data),
		isError: running.isError || settings.isError || words.isError || devices.isError,
		isSuccess: running.isSuccess,
		retry: () => {
			void running.refetch()
			void settings.refetch()
			void words.refetch()
			devices.retry()
		},
	}
}
