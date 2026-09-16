import { readStoredWord } from "@/services/storage/codec"
import { presetById } from "@/services/words/presets"
import type { Word } from "@/types/word"
import { type ObjectValue, requireRecord } from "@/utils/validation"

const legacyPresetIds: Record<string, string> = {
	"hello": "preset-annyeong",
	"apple": "preset-sagwa",
	"saranghae": "preset-saranghae",
	"bye": "preset-danyeowa",
	"en-hi": "preset-hi",
	"en-hello": "preset-hello",
}

export function legacyPresetId(value: unknown, id: string): string | undefined {
	const wordRecord = requireRecord(value, `word ${id}`)

	if (wordRecord.sourceType !== "preset") {
		return undefined
	}

	return legacyPresetIds[String(wordRecord.presetKey)]
}

export function withPresetAudioUri(value: unknown, id: string): ObjectValue {
	const wordRecord = requireRecord(value, `word ${id}`)
	const preset = presetById.get(legacyPresetId(wordRecord, id) ?? "")

	return preset ? { ...wordRecord, audioUri: preset.audioUri } : wordRecord
}

export function parseLegacyWord(value: unknown, id: string, archived = false): Word {
	const wordRecord = withPresetAudioUri(value, id)

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
