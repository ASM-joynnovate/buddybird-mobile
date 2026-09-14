import { useQuery } from "@tanstack/react-query"

import { useEffect, useRef } from "react"

import { AppState } from "react-native"

import { currentIdentity, subscribeIdentity } from "@/apis/identity"
import { identityQueryOptions } from "@/hooks/apis/identity"
import { useAppData } from "@/hooks/use-app-data"
import { queryClient } from "@/lib/query-client"
import { countFeedbackDay } from "@/services/feedback/policy"
import { startPush } from "@/services/push/lifecycle"
import { mergePushReceipts } from "@/services/push/receipts"
import { readData, updateData } from "@/services/storage/data-store"
import {
	initializeTelemetry,
	reportError,
	setTelemetryIdentity,
	syncUserProperties,
	track,
} from "@/services/telemetry/client"
import { installGlobalErrorReporting } from "@/services/telemetry/global-errors"
import { shouldCheckUpdate } from "@/services/updates/policy"
import { startUploads } from "@/services/uploads/lifecycle"

export function useAppServices() {
	const data = useAppData()

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

		const uploads = startUploads()
		const auth = subscribeIdentity((uid) => {
			if (uid) {
				queryClient.setQueryData(["firebase", "identity"], uid)
				setTelemetryIdentity(uid)
			}
		})

		updateData((next) => {
			countFeedbackDay(next.settings.feedback)
		})

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
					updateData((value) => {
						countFeedbackDay(value.settings.feedback)
					})

					if (shouldCheckUpdate(readData().settings.update.lastCheckedAt, false)) {
						void queryClient.invalidateQueries({ queryKey: ["firebase", "update"] })
					}

					if (!currentIdentity()) {
						void queryClient.invalidateQueries({ queryKey: ["firebase", "identity"] })
					}
				} catch (error) {
					reportError(error, "foreground")
				}
			} else if (next === "background" && previous !== "background") {
				track("app_background", { session_duration_ms: Date.now() - foregroundAt })
			}

			previous = next
		})

		return () => {
			removeErrors()
			uploads()
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

	useEffect(syncUserProperties, [data])
}
