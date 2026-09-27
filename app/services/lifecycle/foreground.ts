import { AppState } from "react-native"

import { initializeTelemetry, reportError, track } from "@/services/telemetry/client"
import { installGlobalErrorReporting } from "@/services/telemetry/global-errors"
import { useDeviceSettingsStore } from "@/stores/device-settings"

let appOpenTracked = false

function recordFeedbackDay(scope: string) {
	try {
		useDeviceSettingsStore.getState().countFeedbackDay()
	} catch (error) {
		reportError(error, scope)
	}
}

export function startForegroundServices() {
	const removeErrors = installGlobalErrorReporting()

	void initializeTelemetry()
		.then(() => {
			if (!appOpenTracked) {
				appOpenTracked = true

				track("app_open", { cold_start: true })
			}
		})
		.catch((error) => reportError(error, "telemetry_start"))

	recordFeedbackDay("app_settings")

	let foregroundAt = Date.now()
	let previous = AppState.currentState

	const lifecycle = AppState.addEventListener("change", (next) => {
		if (next === "active" && previous !== "active") {
			foregroundAt = Date.now()

			void initializeTelemetry(false)
				.then(() => track("app_foreground", {}))
				.catch((error) => reportError(error, "telemetry_foreground"))

			recordFeedbackDay("foreground")
		} else if (next === "background" && previous !== "background") {
			track("app_background", { session_duration_ms: Date.now() - foregroundAt })
		}

		previous = next
	})

	return () => {
		removeErrors()
		lifecycle.remove()
	}
}
