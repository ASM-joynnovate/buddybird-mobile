import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"

import { useAppData } from "@/hooks/use-app-data"
import { useDeviceSetting } from "@/hooks/use-device-setting"
import { useFeedbackDialog } from "@/hooks/use-feedback-dialog"
import { useSession } from "@/hooks/use-session"
import { consumeFeedbackPrompt, feedbackThreshold } from "@/services/feedback/policy"
import { readDeviceSetting, saveDeviceSetting } from "@/services/storage/device-settings"
import { reportError, track } from "@/services/telemetry/client"

export function useFeedbackPrompt(
	updatesSettled: boolean,
	updateVisible: boolean,
	consentResolved: boolean,
) {
	const { t } = useTranslation()
	const data = useAppData()
	const preferences = useDeviceSetting("feedback")
	const feedback = useFeedbackDialog()
	const { snapshot } = useSession()
	const [open, setOpen] = useState(false)
	const feedbackPromptOpen = useRef(false)
	const sessionActive = ["starting", "running", "paused", "interrupted", "stopping"].includes(
		snapshot.state,
	)
	const threshold = feedbackThreshold(preferences)
	const eligible =
		!!data.profile &&
		updatesSettled &&
		!updateVisible &&
		consentResolved &&
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
			const next = readDeviceSetting("feedback")

			consumeFeedbackPrompt(next)
			saveDeviceSetting("feedback", next)

			if (write) {
				feedback.open("prompt")
			} else {
				track("feedback_prompt_dismissed", { threshold })
			}
		} catch (error) {
			reportError(error, "feedback_prompt")
			Alert.alert(t("storage.saveError"))
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
