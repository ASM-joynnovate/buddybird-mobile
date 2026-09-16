import { useQuery } from "@tanstack/react-query"

import { useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { Alert } from "react-native"

import { updateQueryOptions } from "@/hooks/apis/app-update"
import { useDeviceSetting } from "@/hooks/use-device-setting"
import { installedVersion, openStore } from "@/lib/application"
import { reportError, track } from "@/services/telemetry/client"
import { evaluateUpdate } from "@/services/updates/policy"
import { dismissUpdate } from "@/services/updates/preferences"

export function useUpdatePrompt() {
	const { t } = useTranslation()

	const locale = useDeviceSetting("locale")
	const preferences = useDeviceSetting("update")

	const [storeOpening, setStoreOpening] = useState(false)

	const [acceptedUpdate, setAcceptedUpdate] = useState<string | null>(null)

	const shownUpdate = useRef<string | null>(null)

	const update = useQuery(updateQueryOptions())

	const decision = update.data
		? evaluateUpdate(
				update.data,
				installedVersion,
				preferences.dismissedVersion,
				locale,
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
