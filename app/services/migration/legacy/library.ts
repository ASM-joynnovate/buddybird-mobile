import { parseLegacyWord } from "@/services/migration/legacy/words"
import { AppData } from "@/types/app-data"
import { ObjectValue, requireRecord } from "@/utils/validation"

export function applyLegacyLibrary(data: AppData, library: ObjectValue | undefined) {
	if (library) {
		if (library.version !== 1) {
			throw new Error("Unsupported word library version")
		}

		for (const [id, value] of Object.entries(
			requireRecord(library.entriesById, "entriesById"),
		)) {
			data.words[id] = parseLegacyWord(value, id)
		}
	}
}
