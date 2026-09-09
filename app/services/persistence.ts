import { AppData, Locale } from "@/services/data"
import { convertLegacy, requireRecord } from "@/services/legacy"

export const DATA_KEY = "buddybird.data.v1"

export const MIGRATION_KEY = "buddybird.migration.v1"

export const LEGACY_KEY = "buddybird.legacy.v1"

type Store = { set(key: string, value: string): void; getString(key: string): string | undefined }

export function decodeData(serialized: string): AppData {
  const value = requireRecord(JSON.parse(serialized), "app data")

  if (value.version !== 1) {
    throw new Error("Unsupported app data version")
  }

  for (const key of [
    "words",
    "wordAliases",
    "history",
    "progress",
    "captures",
    "sessionDrafts",
    "settings",
  ]) {
    requireRecord(value[key], key)
  }

  if (value.profile !== null) {
    requireRecord(value.profile, "profile")
  }

  if (
    !Array.isArray(value.nativeCaptureReceipts) ||
    !Array.isArray(value.pendingWords) ||
    !Array.isArray(value.pendingFileDeletes)
  ) {
    throw new Error("Invalid upload queue")
  }

  return value as AppData
}

export function writeVerified(store: Store, key: string, value: string) {
  store.set(key, value)

  if (store.getString(key) !== value) {
    throw new Error(`Storage verification failed: ${key}`)
  }
}

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
