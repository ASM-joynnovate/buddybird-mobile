import { parseLegacySettings } from "@/services/migration/legacy/session-settings"
import { isLegacyPreset, parseLegacyWord } from "@/services/migration/legacy/words"
import { migrationGroup, type MigrationStep } from "@/services/migration/step"
import { readProgress } from "@/services/storage/codec"
import type { AppData } from "@/types/app-data"
import { type ObjectValue, readOptionalText, requireId, requireRecord } from "@/utils/validation"

export function applyLegacyTraining(
	data: AppData,
	training: ObjectValue | undefined,
	step: MigrationStep,
) {
	if (!training) {
		return
	}

	if (training.version !== 1) {
		throw new Error("Unsupported training version")
	}

	migrationGroup(data, "trainingWords", () => {
		for (const [id, value] of Object.entries(requireRecord(training.wordsById, "wordsById"))) {
			step(`trainingWords/${id}`, () => {
				const trainingWord = requireRecord(value, `training word ${id}`)
				const libraryId = readOptionalText(trainingWord.libraryEntryId, "libraryEntryId")

				requireId(id)

				if (trainingWord.id !== id) {
					throw new Error(`Training word key mismatch: ${id}`)
				}

				if (libraryId) {
					requireId(libraryId)
				}

				if (isLegacyPreset(trainingWord, id)) {
					return
				}

				const canonical = libraryId ? (data.wordAliases[libraryId] ?? libraryId) : undefined

				if (!canonical || !data.words[canonical]) {
					if (data.words[id]) {
						throw new Error(`Ambiguous word identity: ${id}`)
					}

					data.words[id] = parseLegacyWord(trainingWord, id, true)
				}

				if (canonical) {
					data.wordAliases[id] = canonical
				}
			})
		}
	})

	migrationGroup(data, "progress", () => {
		for (const [id, value] of Object.entries(
			requireRecord(training.wordProgressByWordId, "wordProgressByWordId"),
		)) {
			step(`progress/${id}`, () => {
				const incoming = readProgress(value, id)
				const current = data.progress[id]

				data.progress[id] = current
					? {
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

	step("lastSession", () => {
		if (training.lastSessionSettings !== undefined) {
			const settings = parseLegacySettings(training.lastSessionSettings)

			data.settings.lastSession ??= settings
		}
	})
}
