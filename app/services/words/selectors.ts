import { presetById, presets } from "@/services/words/presets"
import type { AppData } from "@/types/app-data"
import type { Locale } from "@/types/locale"
import type { Word } from "@/types/word"

export function currentWord(data: AppData, id: string): Word | undefined {
	const canonical = data.wordAliases[id] ?? id

	return presetById.get(canonical) ?? data.words[canonical]
}

export function visibleWords(data: AppData, locale: Locale): Word[] {
	const recordings = Object.values(data.words)
		.filter((word) => !word.archived && word.sourceType === "recording")
		.sort(
			(left, right) =>
				left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id),
		)

	return [...presets.filter((preset) => preset.locale === locale), ...recordings]
}
