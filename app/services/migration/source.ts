import type  { Store } from "@/types/storage"
import { SOURCE_KEY } from "@/services/storage/keys"
import { requireRecord, requireText } from "@/utils/validation"

export type MigrationSource =
	| { version: 1; kind: "mmkv"; serialized: string }
	| { version: 1; kind: "async-storage"; values: Record<string, string> }

export function readMigrationSource(store: Store): MigrationSource | undefined {
	const saved = store.getString(SOURCE_KEY)

	if (saved === undefined) {
		return undefined
	}

	const value = requireRecord(JSON.parse(saved), "migration source")

	if (value.version !== 1) {
		throw new Error("Unsupported migration source version")
	}

	if (value.kind === "mmkv") {
		return { version: 1, kind: "mmkv", serialized: requireText(value.serialized, "saved MMKV") }
	}

	if (value.kind !== "async-storage") {
		throw new Error("Invalid migration source")
	}

	const values = requireRecord(value.values, "saved AsyncStorage")

	for (const [key, entry] of Object.entries(values)) {
		requireText(entry, key)
	}

	return { version: 1, kind: "async-storage", values: values as Record<string, string> }
}

export function isMigrationMediaReferenced(
	source: MigrationSource,
	uri: string,
	resolve: (uri: string) => string,
) {
	const target = resolve(uri)
	const records: unknown[] =
		source.kind === "mmkv"
			? [JSON.parse(source.serialized)]
			: Object.entries(source.values)
					.filter(([key]) => /\/(wordLibrary|training-store|parrot-profile)$/.test(key))
					.map(([, value]) => JSON.parse(value) as unknown)

	while (records.length) {
		const record = records.pop()

		if (typeof record !== "object" || record === null) {
			continue
		}

		for (const [key, value] of Object.entries(record)) {
			if (
				["audioUri", "transformedAudioUri", "photoUri"].includes(key) &&
				typeof value === "string" &&
				value &&
				resolve(value) === target
			) {
				return true
			}

			if (typeof value === "object" && value !== null) {
				records.push(value)
			}
		}
	}

	return false
}
