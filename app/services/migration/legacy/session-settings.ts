import { parseSourceType } from "@/services/migration/legacy/words"
import { SessionSettings } from "@/types/session"
import {
	readOptionalText,
	requireNonnegativeNumber,
	requireRecord,
	requireText,
} from "@/utils/validation"

export function parseLegacySettings(value: unknown): SessionSettings {
	const sessionRecord = requireRecord(value, "session settings")

	return {
		wordId: requireText(sessionRecord.wordId, "wordId"),
		sourceType: parseSourceType(sessionRecord.sourceType),
		libraryEntryId: readOptionalText(sessionRecord.libraryEntryId, "libraryEntryId"),
		totalDurationSeconds: requireNonnegativeNumber(
			sessionRecord.totalDurationSeconds,
			"totalDurationSeconds",
		),
		learningDurationSeconds: requireNonnegativeNumber(
			sessionRecord.learningDurationSeconds,
			"learningDurationSeconds",
		),
		restDurationSeconds: requireNonnegativeNumber(
			sessionRecord.restDurationSeconds,
			"restDurationSeconds",
		),
		stressCareDurationSeconds:
			sessionRecord.stressCareDurationSeconds === undefined
				? 0
				: requireNonnegativeNumber(
						sessionRecord.stressCareDurationSeconds,
						"stressCareDurationSeconds",
					),
	}
}
