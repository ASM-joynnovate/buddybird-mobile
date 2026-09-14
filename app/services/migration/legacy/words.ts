import { Word, WordSnapshot } from "@/types/word"
import {
	ObjectValue,
	readOptionalText,
	requireChoice,
	requireRecord,
	requireText,
} from "@/utils/validation"

export function parseSourceType(value: unknown) {
	return requireChoice(value, ["preset", "recording"] as const, "sourceType")
}

export function readWordSnapshot(wordRecord: ObjectValue): WordSnapshot {
	return {
		label: requireText(wordRecord.label, "word.label"),
		sourceType: parseSourceType(wordRecord.sourceType),
		audioUri: requireText(wordRecord.audioUri, "word.audioUri"),
		presetKey: readOptionalText(wordRecord.presetKey, "presetKey"),
		transformedAudioUri: readOptionalText(
			wordRecord.transformedAudioUri,
			"transformedAudioUri",
		),
		libraryEntryId: readOptionalText(wordRecord.libraryEntryId, "libraryEntryId"),
	}
}

export function parseLegacyWord(value: unknown, id: string, archived = false): Word {
	const wordRecord = requireRecord(value, `word ${id}`)

	if (wordRecord.id !== id) {
		throw new Error(`Word key mismatch: ${id}`)
	}

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

	return {
		id,
		...readWordSnapshot(wordRecord),
		tag: requireChoice(tag, ["greeting", "food", "name", "etc"] as const, "tag"),
		createdAt: requireText(wordRecord.createdAt, "word.createdAt"),
		updatedAt: requireText(wordRecord.updatedAt, "word.updatedAt"),
		...(archived ? { archived: true } : {}),
	}
}
