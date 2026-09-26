import { FEEDBACK_PROMPT_THRESHOLDS } from "@/config"
import type { DeviceSettings } from "@/types/device-settings"

export function feedbackThreshold(state: DeviceSettings["feedback"]) {
	const lastIndex = FEEDBACK_PROMPT_THRESHOLDS.length - 1

	return FEEDBACK_PROMPT_THRESHOLDS[Math.min(Math.max(state.thresholdIndex, 0), lastIndex)]
}

export function validateFeedback(message: string) {
	const trimmed = message.trim()

	if (!trimmed || trimmed.length > 1000) {
		throw new Error("Feedback must contain 1–1000 characters")
	}

	return trimmed
}
