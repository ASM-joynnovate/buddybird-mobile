import { useQuery } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"

import { appUpdateQueryOptions } from "@/hooks/apis/app-update"
import { installedVersion, openStore } from "@/services/device/application"
import { reportError, track } from "@/services/telemetry/client"
import { evaluateUpdate, UPDATE_INTERVAL } from "@/services/updates/policy"
import { useDeviceSettingsStore } from "@/stores/device-settings"

export function useUpdatePrompt() {
	const { t } = useTranslation()

	const preferences = useDeviceSettingsStore((state) => state.update)

	const [storeOpening, setStoreOpening] = useState(false)

	const [acceptedUpdate, setAcceptedUpdate] = useState<string | null>(null)

	const shownUpdate = useRef<string | null>(null)

	const update = useQuery({ ...appUpdateQueryOptions(), staleTime: UPDATE_INTERVAL })

	const decision = update.data
		? evaluateUpdate(
				{
					latestVersion: update.data.latest_version,
					minimumVersion: update.data.min_supported_version,
					notes: update.data.release_notes,
				},
				installedVersion,
				preferences.dismissedVersion,
			)
		: null

	const updateVisible =
		!!decision && (decision.forced || acceptedUpdate !== decision.latestVersion)

	const updatesSettled =
		!update.isFetching &&
		(update.isSuccess || update.isError || update.fetchStatus === "paused")

	useEffect(() => {
		if (updateVisible && decision && shownUpdate.current !== decision.latestVersion) {
			shownUpdate.current = decision.latestVersion

			track("update_prompt_shown", {
				latest_version: decision.latestVersion,
				is_forced: decision.forced,
			})
		}
	}, [updateVisible, decision])

	async function acceptUpdate() {
		if (!decision || storeOpening) {
			return
		}

		setStoreOpening(true)

		try {
			track("update_prompt_accepted", {
				latest_version: decision.latestVersion,
				is_forced: decision.forced,
			})

			await openStore()

			if (!decision.forced) {
				setAcceptedUpdate(decision.latestVersion)
			}
		} catch (error) {
			reportError(error, "open_store")
			throw error
		} finally {
			setStoreOpening(false)
		}
	}

	const dismissUpdatePrompt = () => {
		if (!decision || decision.forced) {
			return
		}

		try {
			useDeviceSettingsStore.getState().dismissUpdate(decision.latestVersion)

			track("update_prompt_dismissed", { latest_version: decision.latestVersion })
		} catch (error) {
			reportError(error, "dismiss_update")

			Alert.alert(t("app.update.error"))
		}
	}

	return {
		decision,
		updateVisible,
		updatesSettled,
		storeOpening,
		acceptUpdate,
		dismissUpdatePrompt,
	}
}
