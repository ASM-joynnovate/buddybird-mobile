import { useEffect, useRef, useState } from "react"

import { useAppData } from "@/hooks/use-app-data"
import { useFeedbackDialog } from "@/hooks/use-feedback-dialog"
import { useSession } from "@/hooks/use-session"
import { consumeFeedbackPrompt, feedbackThreshold } from "@/services/feedback/policy"
import { updateData } from "@/services/storage/data-store"
import { reportError, track } from "@/services/telemetry/client"

export function useFeedbackPrompt(
	updatesSettled: boolean,
	updateVisible: boolean,
	consentResolved: boolean,
) {
	const data = useAppData()
	const feedback = useFeedbackDialog()
	const { snapshot } = useSession()
	const [open, setOpen] = useState(false)
	const feedbackPromptOpen = useRef(false)
	const sessionActive = ["starting", "running", "paused", "interrupted", "stopping"].includes(
		snapshot.state,
	)
	const threshold = feedbackThreshold(data.settings.feedback)
	const eligible =
		!!data.profile &&
		updatesSettled &&
		!updateVisible &&
		consentResolved &&
		!sessionActive &&
		!feedback.source &&
		data.settings.feedback.dayCount >= threshold

	useEffect(() => {
		if (!eligible || feedbackPromptOpen.current) {
			return
		}

		feedbackPromptOpen.current = true
		setOpen(true)
		track("feedback_prompt_shown", { threshold })
	}, [data.settings.feedback, eligible, threshold])

	function consume(write: boolean) {
		if (!feedbackPromptOpen.current) {
			return
		}

		feedbackPromptOpen.current = false

		try {
			updateData((next) => {
				consumeFeedbackPrompt(next.settings.feedback)
			})

			if (write) {
				feedback.open("prompt")
			} else {
				track("feedback_prompt_dismissed", { threshold })
			}
		} catch (error) {
			reportError(error, "feedback_prompt")
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
