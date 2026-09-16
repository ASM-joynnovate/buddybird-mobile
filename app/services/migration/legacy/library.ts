import { parseLegacyWord } from "@/services/migration/legacy/words"
import type  { MigrationStep } from "@/services/migration/step"
import type { AppData } from "@/types/app-data"
import { type ObjectValue, requireRecord } from "@/utils/validation"

export function applyLegacyLibrary(
	data: AppData,
	library: ObjectValue | undefined,
	step: MigrationStep,
) {
	if (library) {
		if (library.version !== 1) {
			throw new Error("Unsupported word library version")
		}

		for (const [id, value] of Object.entries(
			requireRecord(library.entriesById, "entriesById"),
		)) {
			step(`words/${id}`, () => {
				const word = parseLegacyWord(value, id)

				data.words[id] ??= word
			})
		}
	}
}
