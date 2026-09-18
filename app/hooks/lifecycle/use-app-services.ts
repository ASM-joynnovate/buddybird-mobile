import { useQuery } from "@tanstack/react-query"
import i18next from "i18next"
import { useEffect, useRef } from "react"
import { Alert, AppState } from "react-native"

import { currentIdentity, subscribeIdentity } from "@/apis/identity"
import { identityQueryOptions } from "@/hooks/apis/identity"
import { useAppData } from "@/hooks/use-app-data"
import { useDeviceSetting } from "@/hooks/use-device-setting"
import { queryClient } from "@/lib/query-client"
import { countFeedbackDay } from "@/services/feedback/policy"
import { startPush } from "@/services/push/lifecycle"
import { mergePushReceipts } from "@/services/push/receipts"
import { readDeviceSetting, saveDeviceSetting } from "@/services/storage/device-settings"
import {
	initializeTelemetry,
	reportError,
	setTelemetryIdentity,
	syncUserProperties,
	track,
} from "@/services/telemetry/client"
import { installGlobalErrorReporting } from "@/services/telemetry/global-errors"
import { shouldCheckUpdate } from "@/services/updates/policy"

export function useAppServices() {
	const data = useAppData()
	const locale = useDeviceSetting("locale")

	const profileId = data.profile?.id

	const opened = useRef(false)

	const identity = useQuery(identityQueryOptions())

	useEffect(() => {
		const removeErrors = installGlobalErrorReporting()

		void initializeTelemetry().catch((error) => reportError(error, "telemetry_start"))

		if (!opened.current) {
			opened.current = true
			track("app_open", { cold_start: true })
		}

		const auth = subscribeIdentity((uid) => {
			if (uid) {
				queryClient.setQueryData(["firebase", "identity"], uid)
				setTelemetryIdentity(uid)
			}
		})

		function recordVisit() {
			const feedback = readDeviceSetting("feedback")

			countFeedbackDay(feedback)
			saveDeviceSetting("feedback", feedback)
		}

		try {
			mergePushReceipts()
			recordVisit()
		} catch (error) {
			reportError(error, "app_settings")
			Alert.alert(i18next.t("storage.saveError"))
		}

		let foregroundAt = Date.now()
		let previous = AppState.currentState
		const lifecycle = AppState.addEventListener("change", (next) => {
			if (next === "active" && previous !== "active") {
				foregroundAt = Date.now()
				void initializeTelemetry(false).catch((error) =>
					reportError(error, "telemetry_foreground"),
				)
				track("app_foreground", {})

				try {
					mergePushReceipts()
					recordVisit()

					if (shouldCheckUpdate(readDeviceSetting("update").lastCheckedAt, false)) {
						void queryClient.invalidateQueries({ queryKey: ["firebase", "update"] })
					}

					if (!currentIdentity()) {
						void queryClient.invalidateQueries({ queryKey: ["firebase", "identity"] })
					}
				} catch (error) {
					reportError(error, "foreground")
					Alert.alert(i18next.t("storage.saveError"))
				}
			} else if (next === "background" && previous !== "background") {
				track("app_background", { session_duration_ms: Date.now() - foregroundAt })
			}

			previous = next
		})

		return () => {
			removeErrors()
			auth()
			lifecycle.remove()
		}
	}, [])

	useEffect(() => {
		if (identity.data) {
			setTelemetryIdentity(identity.data)
		}
	}, [identity.data])

	useEffect(() => {
		if (!profileId) {
			return
		}

		return startPush()
	}, [profileId])

	useEffect(syncUserProperties, [data, locale])
}
