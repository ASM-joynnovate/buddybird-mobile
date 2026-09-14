import { AppData } from "@/types/app-data"
import {
	ObjectValue,
	readNullableText,
	requireChoice,
	requireNonnegativeNumber,
} from "@/utils/validation"

export function applyLegacyConsent(data: AppData, consent: ObjectValue | undefined) {
	if (consent) {
		data.settings.uploadConsent = {
			status: requireChoice(
				consent.status,
				["unknown", "granted", "denied"] as const,
				"upload consent",
			),
			decidedAt: readNullableText(consent.decidedAt, "decidedAt"),
			noticeVersion: requireNonnegativeNumber(consent.noticeVersion, "noticeVersion"),
		}
	}
}
