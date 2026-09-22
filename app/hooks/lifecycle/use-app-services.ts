import i18next from "i18next"
import { useEffect, useRef } from "react"
import { Alert, AppState } from "react-native"

import { apiKeys } from "@/hooks/apis/keys"
import { useAppData } from "@/hooks/use-app-data"
import { queryClient } from "@/lib/query-client"
import { startPush } from "@/services/push/lifecycle"
import {
	initializeTelemetry,
	reportError,
	setTelemetryIdentity,
	syncUserProperties,
	track,
} from "@/services/telemetry/client"
import { installGlobalErrorReporting } from "@/services/telemetry/global-errors"
import { shouldCheckUpdate } from "@/services/updates/policy"
import { useAccountStore } from "@/stores/account"
import { useDeviceSettingsStore } from "@/stores/device-settings"

export function useAppServices() {
	const data = useAppData()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const serverUserId = useAccountStore((account) => account.serverUserId)

	const profileId = data.profile?.id

	const opened = useRef(false)

	useEffect(() => {
		const removeErrors = installGlobalErrorReporting()

		void initializeTelemetry()
			.then(() => {
				if (!opened.current) {
					opened.current = true

					track("app_open", { cold_start: true })
				}
			})
			.catch((error) => reportError(error, "telemetry_start"))

		try {
			useDeviceSettingsStore.getState().countFeedbackDay()
		} catch (error) {
			reportError(error, "app_settings")

			Alert.alert(i18next.t("app.storage.saveError"))
		}

		let foregroundAt = Date.now()
		let previous = AppState.currentState

		const lifecycle = AppState.addEventListener("change", (next) => {
			if (next === "active" && previous !== "active") {
				foregroundAt = Date.now()

				void initializeTelemetry(false)
					.then(() => track("app_foreground", {}))
					.catch((error) => reportError(error, "telemetry_foreground"))

				try {
					useDeviceSettingsStore.getState().countFeedbackDay()

					const updateState = queryClient.getQueryState(apiKeys.appUpdate())
					const updateAttemptedAt = Math.max(
						updateState?.dataUpdatedAt ?? 0,
						updateState?.errorUpdatedAt ?? 0,
					)
					const updateCheckedAt = updateAttemptedAt > 0 ? updateAttemptedAt : null

					if (shouldCheckUpdate(updateCheckedAt, false)) {
						void queryClient.invalidateQueries({ queryKey: apiKeys.appUpdate() })
					}
				} catch (error) {
					reportError(error, "foreground")

					Alert.alert(i18next.t("app.storage.saveError"))
				}
			} else if (next === "background" && previous !== "background") {
				track("app_background", { session_duration_ms: Date.now() - foregroundAt })
			}

			previous = next
		})

		return () => {
			removeErrors()
			lifecycle.remove()
		}
	}, [])

	useEffect(() => setTelemetryIdentity(serverUserId), [serverUserId])

	useEffect(() => {
		if (!profileId) {
			return
		}

		return startPush()
	}, [profileId])

	useEffect(syncUserProperties, [data, locale])
}
