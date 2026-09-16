import { presets } from "@/services/words/catalog"
import type { AppData } from "@/types/app-data"
import type { Locale } from "@/types/locale"

const presetOrder = new Map<string, number>(
	presets.map((preset, index) => [preset.presetKey, index]),
)

export function currentWord(data: AppData, id: string) {
	return data.words[data.wordAliases[id] ?? id]
}

export function visibleWords(data: AppData, locale: Locale) {
	return Object.values(data.words)
		.filter(
			(word) =>
				!word.archived &&
				(word.sourceType === "recording" ||
					word.presetKey?.startsWith("en-") === (locale === "en")),
		)
		.sort((left, right) => {
			if (left.sourceType !== right.sourceType) {
				return left.sourceType === "preset" ? -1 : 1
			}

			const order =
				left.sourceType === "preset"
					? (presetOrder.get(left.presetKey ?? "") ?? presets.length) -
						(presetOrder.get(right.presetKey ?? "") ?? presets.length)
					: 0

			return (
				order ||
				left.createdAt.localeCompare(right.createdAt) ||
				left.id.localeCompare(right.id)
			)
		})
}
