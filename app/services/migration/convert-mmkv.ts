import { parseLegacyProfile } from "@/services/migration/legacy/profile"
import { applyLegacyPush } from "@/services/migration/legacy/push"
import { applyLegacyReceipts } from "@/services/migration/legacy/push-receipts"
import { parseLegacySettings } from "@/services/migration/legacy/session-settings"
import { applyLegacyConsent } from "@/services/migration/legacy/upload-consent"
import { applyLegacyMetrics } from "@/services/migration/legacy/word-metrics"
import { parseLegacyWord } from "@/services/migration/legacy/words"
import type  { ImportDeviceSetting } from "@/services/migration/legacy/convert"
import { migrationGroup, type MigrationStep } from "@/services/migration/step"
import { readHistory, readProgress, readSessionDraft } from "@/services/storage/codec"
import type  { AppData } from "@/types/app-data"
import type  { DeviceSettings } from "@/types/device-settings"
import { requireId, requireList, requireRecord, requireText } from "@/utils/validation"

export function convertMMKV(
	serialized: string,
	data: AppData,
	step: MigrationStep,
	importSetting: ImportDeviceSetting,
) {
	const value = requireRecord(JSON.parse(serialized), "previous app data")

	if (value.version !== 1) {
		throw new Error("Unsupported previous app data version")
	}

	function group(key: string, apply: () => void) {
		migrationGroup(data, key, apply)
	}

	step("profile", () => {
		if (value.profile !== null) {
			const profile = parseLegacyProfile(value.profile)

			data.profile ??= profile
		}
	})

	for (const [key, read] of [
		["words", parseLegacyWord],
		["history", readHistory],
		["sessionDrafts", readSessionDraft],
	] as const) {
		group(key, () => {
			const target: Record<string, unknown> = data[key]

			for (const [id, entry] of Object.entries(requireRecord(value[key], key))) {
				step(`${key}/${id}`, () => {
					let record = requireRecord(entry, id)

					if (key === "history") {
						record = { ...record, ...parseLegacySettings(record) }
					} else if (key === "sessionDrafts") {
						record = { ...record, settings: parseLegacySettings(record.settings) }
					}

					const parsed = read(record, id, record.archived === true)

					target[id] ??= parsed
				})
			}
		})
	}

	group("wordAliases", () => {
		for (const [id, alias] of Object.entries(
			requireRecord(value.wordAliases, "word aliases"),
		)) {
			step(`wordAliases/${id}`, () => {
				const target = requireId(alias)

				requireId(id)
				data.wordAliases[id] ??= target
			})
		}
	})
	group("progress", () => {
		for (const [id, entry] of Object.entries(requireRecord(value.progress, "progress"))) {
			step(`progress/${id}`, () => {
				const incoming = readProgress(entry, id)
				const current = data.progress[id]

				data.progress[id] = current
					? {
							...incoming,
							...current,
							totalTrainingSeconds:
								current.totalTrainingSeconds + incoming.totalTrainingSeconds,
							sessionCount: current.sessionCount + incoming.sessionCount,
							successMarkedAt: current.successMarkedAt ?? incoming.successMarkedAt,
							updatedAt: [current.updatedAt, incoming.updatedAt].sort()[1],
						}
					: incoming
			})
		}
	})

	for (const key of ["nativeCaptureReceipts", "pendingWords", "pendingFileDeletes"] as const) {
		step(key, () => {
			const incoming = requireList(value[key], key).map((entry) => requireText(entry, key))

			data[key] = [...new Set([...data[key], ...incoming])]
		})
	}

	group("settings", () => {
		const settings = requireRecord(value.settings, "settings")

		for (const key of ["locale", "analyticsConsent", "update", "feedback"] as const) {
			step(`device/${key}`, () =>
				importSetting(key, settings[key] as DeviceSettings[typeof key]),
			)
		}

		step("uploadConsent", () =>
			applyLegacyConsent(data, requireRecord(settings.uploadConsent, "upload consent")),
		)
		step("push", () => {
			if (settings.push !== null) {
				applyLegacyPush(data, requireRecord(settings.push, "push registration"))
			}
		})
		step("receipts", () => applyLegacyReceipts(data, settings.receipts))
		step("lastSession", () => {
			if (settings.lastSession !== undefined) {
				const saved = parseLegacySettings(settings.lastSession)

				data.settings.lastSession ??= saved
			}
		})
		group("metrics", () =>
			applyLegacyMetrics(data, requireRecord(settings.wordMetrics, "word metrics"), step),
		)
	})
}
