import { useEffect } from "react"

import { useAppData } from "@/hooks/use-app-data"
import { startForegroundServices } from "@/services/lifecycle/foreground"
import { startPush } from "@/services/push/lifecycle"
import { setTelemetryIdentity, syncUserProperties } from "@/services/telemetry/client"
import { useAccountStore } from "@/stores/account"
import { useDeviceSettingsStore } from "@/stores/device-settings"

export function useAppServices() {
	const data = useAppData()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const serverUserId = useAccountStore((account) => account.serverUserId)

	const profileId = data.profile?.id

	useEffect(startForegroundServices, [])

	useEffect(() => setTelemetryIdentity(serverUserId), [serverUserId])

	useEffect(() => {
		if (!profileId) {
			return
		}

		return startPush()
	}, [profileId])

	useEffect(syncUserProperties, [data, locale])
}
