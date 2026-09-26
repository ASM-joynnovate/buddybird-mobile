import { useEffect } from "react"

import { initI18n } from "@/i18n"
import { startForegroundServices } from "@/services/lifecycle/foreground"
import { reportError, setTelemetryIdentity } from "@/services/telemetry/client"
import { useAccountStore } from "@/stores/account"
import { useDeviceSettingsStore } from "@/stores/device-settings"

export function useAppServices() {
	const locale = useDeviceSettingsStore((state) => state.locale)

	const serverUserId = useAccountStore((account) => account.serverUserId)

	useEffect(startForegroundServices, [])

	useEffect(() => setTelemetryIdentity(serverUserId), [serverUserId])

	useEffect(() => {
		void initI18n(locale).catch((error) => reportError(error, "language_restore"))
	}, [locale])
}
