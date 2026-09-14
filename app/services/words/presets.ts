import { readData, updateData } from "@/services/storage/data-store"

import { presets } from "@/services/words/catalog"

export function seedPresets() {
	const data = readData()
	const obsolete = Object.values(data.words).filter(
		(word) =>
			!word.archived &&
			word.sourceType === "preset" &&
			!presets.some((preset) => preset.presetKey === word.presetKey),
	)
	const missing = presets.filter(
		(preset) =>
			!Object.values(data.words).some(
				(word) => word.presetKey === preset.presetKey && !word.archived,
			),
	)

	if (!missing.length && !obsolete.length) {
		return
	}

	updateData((next) => {
		const now = new Date().toISOString()

		for (const word of obsolete) {
			next.words[word.id].archived = true
		}

		for (const preset of missing) {
			const id = `preset-library-${preset.presetKey}`

			next.words[id] = {
				...preset,
				id,
				sourceType: "preset",
				audioUri: `preset://${preset.presetKey}`,
				createdAt: now,
				updatedAt: now,
			}
		}
	})
}
