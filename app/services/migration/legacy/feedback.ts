import { AppData } from "@/types/app-data"
import { ObjectValue, readNullableText, requireNonnegativeNumber } from "@/utils/validation"

export function applyLegacyFeedback(data: AppData, feedback: ObjectValue | undefined) {
	if (feedback) {
		if (feedback.version !== 1) {
			throw new Error("Unsupported feedback version")
		}

		data.settings.feedback = {
			version: 1,
			lastCountedDate: readNullableText(feedback.lastCountedDate, "lastCountedDate"),
			dayCount: requireNonnegativeNumber(feedback.dayCount, "dayCount"),
			thresholdIndex: requireNonnegativeNumber(feedback.thresholdIndex, "thresholdIndex"),
		}
	}
}
