import { AppData } from "@/types/app-data"
import {
	ObjectValue,
	readNullableText,
	requireChoice,
	requireNonnegativeNumber,
} from "@/utils/validation"

export function applyLegacyConsent(data: AppData, consent: ObjectValue | undefined) {
	if (consent) {
		const incoming = {
			status: requireChoice(
				consent.status,
				["unknown", "granted", "denied"] as const,
				"upload consent",
			),
			decidedAt: readNullableText(consent.decidedAt, "decidedAt"),
			noticeVersion: requireNonnegativeNumber(consent.noticeVersion, "noticeVersion"),
		}

		if (
			data.settings.uploadConsent.status === "unknown" &&
			data.settings.uploadConsent.decidedAt === null
		) {
			data.settings.uploadConsent = incoming
		}
	}
}
