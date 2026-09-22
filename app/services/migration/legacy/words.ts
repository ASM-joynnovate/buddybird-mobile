import { readStoredWord } from "@/services/storage/codec"
import type { Word } from "@/types/word"
import { requireRecord } from "@/utils/validation"

export function isLegacyPreset(value: unknown, id: string) {
	return requireRecord(value, `word ${id}`).sourceType === "preset"
}

export function parseLegacyWord(value: unknown, id: string, archived = false): Word {
	const wordRecord = requireRecord(value, `word ${id}`)

	const tags: Record<string, string> = {
		인사: "greeting",
		음식: "food",
		이름: "name",
		기타: "etc",
	}
	const tag =
		archived && wordRecord.tag === undefined
			? "etc"
			: (tags[String(wordRecord.tag)] ?? wordRecord.tag)

	return readStoredWord({ ...wordRecord, tag, ...(archived ? { archived: true } : {}) }, id)
}
