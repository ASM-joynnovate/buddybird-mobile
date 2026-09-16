import { readSessionSettings } from "@/services/storage/codec"
import { SessionSettings } from "@/types/session"
import { requireRecord } from "@/utils/validation"

export function parseLegacySettings(value: unknown): SessionSettings {
	const sessionRecord = requireRecord(value, "session settings")

	return readSessionSettings({
		...sessionRecord,
		stressCareDurationSeconds:
			sessionRecord.stressCareDurationSeconds === undefined
				? 0
				: sessionRecord.stressCareDurationSeconds,
	})
}
