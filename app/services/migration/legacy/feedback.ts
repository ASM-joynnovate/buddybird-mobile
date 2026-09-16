import type { DeviceSettings } from "@/types/device-settings"
import { type ObjectValue, readNullableText, requireNonnegativeNumber } from "@/utils/validation"

export function parseLegacyFeedback(feedback: ObjectValue): DeviceSettings["feedback"] {
	if (feedback.version !== 1) {
		throw new Error("Unsupported feedback version")
	}

	return {
		version: 1,
		lastCountedDate: readNullableText(feedback.lastCountedDate, "lastCountedDate"),
		dayCount: requireNonnegativeNumber(feedback.dayCount, "dayCount"),
		thresholdIndex: requireNonnegativeNumber(feedback.thresholdIndex, "thresholdIndex"),
	}
}
