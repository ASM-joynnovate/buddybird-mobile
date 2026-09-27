import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"

import { parrotsQueryOptions } from "@/hooks/apis/parrots"
import { wordsQueryOptions } from "@/hooks/apis/words"
import { setTelemetryIdentity, syncUserProperties } from "@/services/telemetry/client"
import { useAccountStore } from "@/stores/account"
import { useDeviceSettingsStore } from "@/stores/device-settings"

export function useAnalyticsUser(): void {
	const parrots = useQuery(parrotsQueryOptions())
	const words = useQuery(wordsQueryOptions())

	const serverUserId = useAccountStore((account) => account.serverUserId)
	const locale = useDeviceSettingsStore((state) => state.locale)

	const parrot = parrots.data?.[0] ?? null
	const wordCount = words.data?.length

	useEffect(() => setTelemetryIdentity(serverUserId), [serverUserId])

	useEffect(() => {
		if (wordCount !== undefined) {
			syncUserProperties(parrot, wordCount)
		}
	}, [parrot, wordCount, locale])
}
