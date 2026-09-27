import { useEffect } from "react"

import { initI18n } from "@/i18n"
import { startForegroundServices } from "@/services/lifecycle/foreground"
import { reportError } from "@/services/telemetry/client"
import { useDeviceSettingsStore } from "@/stores/device-settings"

export function useAppServices() {
	const locale = useDeviceSettingsStore((state) => state.locale)

	useEffect(startForegroundServices, [])

	useEffect(() => {
		void initI18n(locale).catch((error) => reportError(error, "language_restore"))
	}, [locale])
}
