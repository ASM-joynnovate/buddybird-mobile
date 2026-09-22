import { useQuery } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"

import { runningSessionQueryOptions } from "@/hooks/apis/sessions"
import { useAppData } from "@/hooks/use-app-data"
import { feedbackThreshold } from "@/services/feedback/policy"
import { reportError, track } from "@/services/telemetry/client"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { useFeedbackStore } from "@/stores/feedback"

export function useFeedbackPrompt(updatesSettled: boolean, updateVisible: boolean) {
	const { t } = useTranslation()

	const data = useAppData()

	const preferences = useDeviceSettingsStore((state) => state.feedback)

	const feedback = useFeedbackStore()

	const running = useQuery(runningSessionQueryOptions())

	const [open, setOpen] = useState(false)

	const feedbackPromptOpen = useRef(false)

	const sessionActive = running.data != null
	const threshold = feedbackThreshold(preferences)
	const eligible =
		!!data.profile &&
		updatesSettled &&
		!updateVisible &&
		!sessionActive &&
		!feedback.source &&
		preferences.dayCount >= threshold

	useEffect(() => {
		if (!eligible || feedbackPromptOpen.current) {
			return
		}

		feedbackPromptOpen.current = true
		setOpen(true)

		track("feedback_prompt_shown", { threshold })
	}, [eligible, threshold])

	function consume(write: boolean) {
		if (!feedbackPromptOpen.current) {
			return
		}

		feedbackPromptOpen.current = false

		try {
			useDeviceSettingsStore.getState().consumeFeedbackPrompt()

			if (write) {
				feedback.open("prompt")
			} else {
				track("feedback_prompt_dismissed", { threshold })
			}
		} catch (error) {
			reportError(error, "feedback_prompt")

			Alert.alert(t("app.storage.saveError"))
		} finally {
			setOpen(false)
		}
	}

	return {
		visible: open && eligible,
		onDismiss: () => consume(false),
		onWrite: () => consume(true),
	}
}
