import type { DeviceSettings } from "@/types/device-settings"
import { localDate } from "@/utils/date"

export function feedbackThreshold(state: DeviceSettings["feedback"]) {
	return [3, 5, 7, 10][Math.min(Math.max(state.thresholdIndex, 0), 3)]
}

export function countFeedbackDay(state: DeviceSettings["feedback"], date = localDate()) {
	if (state.lastCountedDate !== date) {
		state.lastCountedDate = date
		state.dayCount++
	}
}

export function consumeFeedbackPrompt(state: DeviceSettings["feedback"]) {
	state.dayCount = 0
	state.thresholdIndex = Math.min(state.thresholdIndex + 1, 3)
}

export function validateFeedback(message: string) {
	const trimmed = message.trim()

	if (!trimmed || trimmed.length > 1000) {
		throw new Error("Feedback must contain 1–1000 characters")
	}

	return trimmed
}
