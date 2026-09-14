import { convertLegacy } from "@/services/migration/legacy/convert"
import { decodeData } from "@/services/storage/codec"
import { DATA_KEY, LEGACY_KEY, MIGRATION_KEY } from "@/services/storage/keys"
import { writeVerified } from "@/services/storage/verified-write"
import { AppData } from "@/types/app-data"
import { Locale } from "@/types/locale"
import { Store } from "@/types/storage"

export function migrateRecords(
	store: Store,
	values: Record<string, string>,
	locale: Locale,
	prepared?: AppData,
): AppData {
	if (store.getString(MIGRATION_KEY) === "complete") {
		const saved = store.getString(DATA_KEY)

		if (!saved) {
			throw new Error("Migrated data is missing")
		}

		return decodeData(saved)
	}

	const data = prepared ?? convertLegacy(values, locale)

	writeVerified(store, LEGACY_KEY, JSON.stringify(values))
	writeVerified(store, DATA_KEY, JSON.stringify(data))
	// The marker is the final write: interrupted migration can always retry from unchanged originals.
	writeVerified(store, MIGRATION_KEY, "complete")

	return decodeData(store.getString(DATA_KEY)!)
}
