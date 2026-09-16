import { convertLegacy } from "@/services/migration/legacy/convert"
import { mergeAliasedMetrics } from "@/services/migration/legacy/word-metrics"
import type { ImportDeviceSetting } from "@/services/migration/legacy/convert"
import { convertMMKV } from "@/services/migration/convert-mmkv"
import { readMigrationSource, type MigrationSource } from "@/services/migration/source"
import { migrationSteps } from "@/services/migration/step"
import { decodeData } from "@/services/storage/codec"
import { emptyData } from "@/services/storage/empty-data"
import { DATA_KEY, SOURCE_KEY } from "@/services/storage/keys"
import { writeVerified } from "@/services/storage/verified-write"
import { AppData } from "@/types/app-data"
import { Store } from "@/types/storage"

export function importLegacyRecords(
	store: Store,
	source: MigrationSource,
	importSetting: ImportDeviceSetting,
): AppData {
	const saved = store.getString(DATA_KEY)
	const data = saved === undefined ? emptyData() : decodeData(saved)

	if (data.migration.complete) {
		return data
	}

	const original = readMigrationSource(store)

	if (original) {
		source = original
	} else {
		writeVerified(store, SOURCE_KEY, JSON.stringify(source))
	}

	const step = migrationSteps(data)

	if (source.kind === "mmkv") {
		convertMMKV(source.serialized, data, step, importSetting)
	} else {
		convertLegacy(source.values, data, step, importSetting)
	}

	mergeAliasedMetrics(data)

	const serialized = JSON.stringify(data)

	decodeData(serialized)
	writeVerified(store, DATA_KEY, serialized)

	return data
}
