import { parseLegacySettings } from "@/services/migration/legacy/session-settings"
import { parseLegacyWord, readWordSnapshot } from "@/services/migration/legacy/words"
import { AppData } from "@/types/app-data"
import { History } from "@/types/session"
import {
	ObjectValue,
	readOptionalText,
	requireNonnegativeNumber,
	requireRecord,
	requireText,
} from "@/utils/validation"

export function applyLegacyTraining(data: AppData, training: ObjectValue | undefined) {
	const trainingWords = training ? requireRecord(training.wordsById, "wordsById") : {}

	if (training) {
		if (training.version !== 1) {
			throw new Error("Unsupported training version")
		}

		// Recordings are preserved in the immutable source archive; references below keep original media.
		requireRecord(training.recordingsById, "recordingsById")

		for (const [id, value] of Object.entries(trainingWords)) {
			const trainingWord = requireRecord(value, `training word ${id}`)
			const libraryId = readOptionalText(trainingWord.libraryEntryId, "libraryEntryId")

			if (libraryId && data.words[libraryId]) {
				data.wordAliases[id] = libraryId
			} else {
				if (data.words[id]) {
					throw new Error(`Ambiguous word identity: ${id}`)
				}

				data.words[id] = parseLegacyWord(trainingWord, id, true)
			}
		}

		for (const [id, value] of Object.entries(
			requireRecord(training.sessionsById, "sessionsById"),
		)) {
			const historyRecord = requireRecord(value, `session ${id}`)

			if (historyRecord.id !== id) {
				throw new Error(`Session key mismatch: ${id}`)
			}

			const session = parseLegacySettings(historyRecord)
			const original = trainingWords[session.wordId]
			const fallback = data.words[session.libraryEntryId ?? session.wordId]

			if (!original && !fallback) {
				throw new Error(`Missing historical word: ${session.wordId}`)
			}

			const historyEntry: History = {
				...session,
				id,
				completedCycles: requireNonnegativeNumber(
					historyRecord.completedCycles,
					"completedCycles",
				),
				totalLearningSeconds: requireNonnegativeNumber(
					historyRecord.totalLearningSeconds,
					"totalLearningSeconds",
				),
				startedAt: requireText(historyRecord.startedAt, "startedAt"),
				endedAt: readOptionalText(historyRecord.endedAt, "endedAt"),
				word: readWordSnapshot(requireRecord(original ?? fallback, "historical word")),
			}

			data.history[id] = historyEntry
		}

		for (const [id, value] of Object.entries(
			requireRecord(training.wordProgressByWordId, "wordProgressByWordId"),
		)) {
			const progressRecord = requireRecord(value, `progress ${id}`)

			if (progressRecord.wordId !== id) {
				throw new Error(`Progress key mismatch: ${id}`)
			}

			data.progress[id] = {
				wordId: id,
				totalTrainingSeconds: requireNonnegativeNumber(
					progressRecord.totalTrainingSeconds,
					"totalTrainingSeconds",
				),
				sessionCount: requireNonnegativeNumber(progressRecord.sessionCount, "sessionCount"),
				successMarkedAt: readOptionalText(
					progressRecord.successMarkedAt,
					"successMarkedAt",
				),
				updatedAt: requireText(progressRecord.updatedAt, "updatedAt"),
			}
		}

		if (training.lastSessionSettings !== undefined) {
			data.settings.lastSession = parseLegacySettings(training.lastSessionSettings)
		}
	}

	return trainingWords
}
