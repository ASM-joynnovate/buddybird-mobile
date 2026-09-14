import { useQuery } from "@tanstack/react-query"

import { useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { Alert } from "react-native"

import { updateQueryOptions } from "@/hooks/apis/app-update"
import { useAppData } from "@/hooks/use-app-data"
import { installedVersion, openStore } from "@/lib/application"
import { reportError, track } from "@/services/telemetry/client"
import { evaluateUpdate } from "@/services/updates/policy"
import { dismissUpdate } from "@/services/updates/preferences"

export function useUpdatePrompt(telemetryReady: boolean) {
	const { t } = useTranslation()

	const data = useAppData()

	const [storeOpening, setStoreOpening] = useState(false)

	const [acceptedUpdate, setAcceptedUpdate] = useState<string | null>(null)

	const shownUpdate = useRef<string | null>(null)

	const update = useQuery({ ...updateQueryOptions(), enabled: telemetryReady })

	const decision = update.data
		? evaluateUpdate(
				update.data,
				installedVersion,
				data.settings.update.dismissedVersion,
				data.settings.locale,
			)
		: null

	const updateVisible =
		!!decision && (decision.forced || acceptedUpdate !== decision.latestVersion)

	const updatesSettled =
		telemetryReady &&
		!update.isFetching &&
		(update.isSuccess || update.isError || update.fetchStatus === "paused")

	useEffect(() => {
		if (
			telemetryReady &&
			updateVisible &&
			decision &&
			shownUpdate.current !== decision.latestVersion
		) {
			shownUpdate.current = decision.latestVersion
			track("update_prompt_shown", {
				latest_version: decision.latestVersion,
				is_forced: decision.forced,
			})
		}
	}, [telemetryReady, updateVisible, decision])

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
			dismissUpdate(decision.latestVersion)
			track("update_prompt_dismissed", { latest_version: decision.latestVersion })
		} catch (error) {
			reportError(error, "dismiss_update")
			Alert.alert(t("update.error"))
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
