import { parseLegacySettings } from "@/services/migration/legacy/session-settings"
import { parseLegacyWord } from "@/services/migration/legacy/words"
import { migrationGroup, type MigrationStep } from "@/services/migration/step"
import { readProgress, readWordSnapshot } from "@/services/storage/codec"
import type { AppData } from "@/types/app-data"
import type { History } from "@/types/session"
import {
	type ObjectValue,
	readOptionalText,
	requireId,
	requireNonnegativeNumber,
	requireRecord,
	requireText,
} from "@/utils/validation"

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

	let trainingWords: ObjectValue = {}

	migrationGroup(data, "trainingWords", () => {
		trainingWords = requireRecord(training.wordsById, "wordsById")

		for (const [id, value] of Object.entries(trainingWords)) {
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

				if (!libraryId || !data.words[libraryId]) {
					if (data.words[id]) {
						throw new Error(`Ambiguous word identity: ${id}`)
					}

					data.words[id] = parseLegacyWord(trainingWord, id, true)
				}

				if (libraryId) {
					data.wordAliases[id] = libraryId
				}
			})
		}
	})

	migrationGroup(data, "history", () => {
		for (const [id, value] of Object.entries(
			requireRecord(training.sessionsById, "sessionsById"),
		)) {
			step(`history/${id}`, () => {
				const record = requireRecord(value, `session ${id}`)

				requireId(id)

				if (record.id !== id) {
					throw new Error(`Session key mismatch: ${id}`)
				}

				const session = parseLegacySettings(record)
				const original = trainingWords[session.wordId]
				const fallback = data.words[session.libraryEntryId ?? session.wordId]
				const history: History = {
					...session,
					id,
					completedCycles: requireNonnegativeNumber(
						record.completedCycles,
						"completedCycles",
					),
					totalLearningSeconds: requireNonnegativeNumber(
						record.totalLearningSeconds,
						"totalLearningSeconds",
					),
					startedAt: requireText(record.startedAt, "startedAt"),
					endedAt: readOptionalText(record.endedAt, "endedAt"),
					word: readWordSnapshot(requireRecord(original ?? fallback, "historical word")),
				}

				data.history[id] ??= history
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
							updatedAt: [current.updatedAt, incoming.updatedAt].sort().at(-1)!,
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
