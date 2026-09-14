import { useQuery } from "@tanstack/react-query"

import { useEffect, useState } from "react"

import { AppState } from "react-native"

import { currentIdentity, subscribeIdentity } from "@/apis/identity"
import { identityQueryOptions } from "@/hooks/apis/identity"
import { useAppData } from "@/hooks/use-app-data"
import { queryClient } from "@/lib/query-client"
import { countFeedbackDay } from "@/services/feedback/policy"
import { ageMonths, profileStats } from "@/services/profile/statistics"
import { startPush } from "@/services/push/lifecycle"
import { mergePushReceipts } from "@/services/push/receipts"
import { readData, updateData } from "@/services/storage/data-store"
import {
	initializeTelemetry,
	reportError,
	setTelemetryIdentity,
	setUserProperties,
	track,
} from "@/services/telemetry/client"
import { installGlobalErrorReporting } from "@/services/telemetry/global-errors"
import { shouldCheckUpdate } from "@/services/updates/policy"
import { startUploads } from "@/services/uploads/lifecycle"

export function useAppServices() {
	const data = useAppData()

	const profileId = data.profile?.id

	const [telemetryReady, setTelemetryReady] = useState(false)

	const identity = useQuery(identityQueryOptions())

	useEffect(() => {
		const removeErrors = installGlobalErrorReporting()
		let mounted = true

		void initializeTelemetry()
			.catch((error) => reportError(error, "telemetry_start"))
			.finally(() => {
				if (mounted) {
					setTelemetryReady(true)
					track("app_open", { cold_start: true })
				}
			})

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
				void initializeTelemetry(false)
					.then(() => track("app_foreground", {}))
					.catch((error) => reportError(error, "telemetry_foreground"))

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
			mounted = false
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

	useEffect(() => {
		if (!telemetryReady || !data.profile) {
			return
		}

		const stats = profileStats(data)

		setUserProperties({
			profile_age_days: Math.max(
				0,
				Math.floor((Date.now() - Date.parse(data.profile.createdAt)) / 86400_000),
			),
			parrot_name: data.profile.name,
			parrot_species: data.profile.species,
			parrot_age_months: ageMonths(data.profile.birthDate),
			total_words_registered: stats.wordCount,
			total_training_sessions: stats.sessionCount,
			locale: data.settings.locale,
		})
	}, [data, telemetryReady])

	return telemetryReady
}
