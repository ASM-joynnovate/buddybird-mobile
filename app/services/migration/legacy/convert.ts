import { parseLegacyUpdate } from "@/services/migration/legacy/app-update"
import { parseLegacyFeedback } from "@/services/migration/legacy/feedback"
import { applyLegacyLibrary } from "@/services/migration/legacy/library"
import { parseLegacyProfile } from "@/services/migration/legacy/profile"
import { applyLegacyPush } from "@/services/migration/legacy/push"
import { applyLegacyReceipts } from "@/services/migration/legacy/push-receipts"
import { applyLegacyTraining } from "@/services/migration/legacy/training"
import { applyLegacyConsent } from "@/services/migration/legacy/upload-consent"
import { applyLegacyMetrics } from "@/services/migration/legacy/word-metrics"
import { migrationGroup, type MigrationStep } from "@/services/migration/step"
import type { AppData } from "@/types/app-data"
import type { DeviceSettings } from "@/types/device-settings"
import { type ObjectValue, requireChoice, requireRecord } from "@/utils/validation"

export type ImportDeviceSetting = <K extends keyof DeviceSettings>(
	key: K,
	value: DeviceSettings[K],
) => void

export function convertLegacy(
	values: Record<string, string>,
	data: AppData,
	step: MigrationStep,
	importSetting: ImportDeviceSetting,
) {
	function readRawValue(key: string): string | undefined {
		return values[`@buddybird/${key}`] ?? values[`@pethub/${key}`]
	}

	function readParsedValue(key: string): unknown {
		const value = readRawValue(key)

		return value === undefined ? undefined : JSON.parse(value)
	}

	function readRecord(key: string): ObjectValue | undefined {
		const value = readParsedValue(key)

		return value === undefined ? undefined : requireRecord(value, key)
	}

	function group(key: string, apply: () => void) {
		migrationGroup(data, key, apply)
	}

	step("profile", () => {
		const profile = readParsedValue("parrot-profile")

		if (profile !== undefined) {
			const parsed = parseLegacyProfile(profile)

			data.profile ??= parsed
		}
	})
	step("device/locale", () => {
		const locale = readRawValue("locale")

		if (locale !== undefined) {
			importSetting("locale", requireChoice(locale, ["ko", "en"] as const, "locale"))
		}
	})
	step("device/analyticsConsent", () => {
		const analytics = readRawValue("analytics-consent")

		if (analytics !== undefined) {
			importSetting(
				"analyticsConsent",
				requireChoice(
					analytics,
					["unknown", "granted", "denied", "not_applicable"] as const,
					"analytics consent",
				),
			)
		}
	})
	step("device/update", () => {
		const update = readRecord("app-update")

		if (update) {
			importSetting("update", parseLegacyUpdate(update))
		}
	})
	step("device/feedback", () => {
		const feedback = readRecord("feedback-prompt")

		if (feedback) {
			importSetting("feedback", parseLegacyFeedback(feedback))
		}
	})

	const before = new Set(Object.keys(data.words))

	group("words", () => applyLegacyLibrary(data, readRecord("wordLibrary"), step))
	group("training", () => applyLegacyTraining(data, readRecord("training-store"), step))
	step("uploadConsent", () => applyLegacyConsent(data, readRecord("upload-consent")))
	step("push", () => applyLegacyPush(data, readRecord("fcm-registration")))
	step("receipts", () => applyLegacyReceipts(data, readParsedValue("fcm-message-receipts")))
	group("metrics", () => applyLegacyMetrics(data, readRecord("analytics-word-metrics"), step))

	for (const word of Object.values(data.words)) {
		if (!before.has(word.id) && word.sourceType === "recording" && !word.archived) {
			data.pendingWords.push(word.id)
		}
	}
}
