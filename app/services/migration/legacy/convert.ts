import { applyLegacyUpdate } from "@/services/migration/legacy/app-update"
import { applyLegacyCaptures } from "@/services/migration/legacy/captures"
import { applyLegacyFeedback } from "@/services/migration/legacy/feedback"
import { applyLegacyLibrary } from "@/services/migration/legacy/library"
import { parseLegacyProfile } from "@/services/migration/legacy/profile"
import { applyLegacyPush } from "@/services/migration/legacy/push"
import { applyLegacyReceipts } from "@/services/migration/legacy/push-receipts"
import { applyLegacyTraining } from "@/services/migration/legacy/training"
import { applyLegacyConsent } from "@/services/migration/legacy/upload-consent"
import { applyLegacyMetrics } from "@/services/migration/legacy/word-metrics"
import { emptyData } from "@/services/storage/empty-data"
import { AppData } from "@/types/app-data"
import { Locale } from "@/types/locale"
import { ObjectValue, requireChoice, requireRecord } from "@/utils/validation"

const prefixes = ["@buddybird/", "@pethub/"]

/** Translate documented wire records. Every original byte is also archived by migration. */
export function convertLegacy(values: Record<string, string>, locale: Locale): AppData {
	const data = emptyData(locale)

	function readRawValue(key: string): string | undefined {
		for (const prefix of prefixes) {
			if (Object.hasOwn(values, prefix + key)) {
				return values[prefix + key]
			}
		}

		return undefined
	}

	function readParsedValue(key: string): unknown {
		const value = readRawValue(key)

		return value === undefined ? undefined : JSON.parse(value)
	}

	function readRecord(key: string): ObjectValue | undefined {
		const value = readParsedValue(key)

		return value === undefined ? undefined : requireRecord(value, key)
	}

	const savedProfile = readParsedValue("parrot-profile")

	if (savedProfile !== undefined) {
		data.profile = parseLegacyProfile(savedProfile)
	}

	const savedLocale = readRawValue("locale")

	if (savedLocale !== undefined) {
		data.settings.locale = requireChoice(savedLocale, ["ko", "en"] as const, "locale")
	}

	const analytics = readRawValue("analytics-consent")

	if (analytics !== undefined) {
		data.settings.analyticsConsent = requireChoice(
			analytics,
			["unknown", "granted", "denied", "not_applicable"] as const,
			"analytics-consent",
		)
	}

	applyLegacyLibrary(data, readRecord("wordLibrary"))

	const trainingWords = applyLegacyTraining(data, readRecord("training-store"))

	applyLegacyCaptures(data, readRecord("follow-along-captures"), trainingWords)

	applyLegacyConsent(data, readRecord("upload-consent"))

	applyLegacyUpdate(data, readRecord("app-update"))

	applyLegacyFeedback(data, readRecord("feedback-prompt"))

	applyLegacyPush(data, readRecord("fcm-registration"))

	applyLegacyReceipts(data, readParsedValue("fcm-message-receipts"))

	applyLegacyMetrics(data, readRecord("analytics-word-metrics"))

	data.pendingWords = Object.values(data.words)
		.filter((storedWord) => storedWord.sourceType === "recording" && !storedWord.archived)
		.map((storedWord) => storedWord.id)

	return data
}
