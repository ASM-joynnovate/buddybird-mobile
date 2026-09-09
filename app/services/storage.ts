import { MMKV } from "react-native-mmkv"

import { AppData } from "@/services/data"
import { DATA_KEY, decodeData, MIGRATION_KEY, writeVerified } from "@/services/persistence"

export const storage = new MMKV({ id: "buddybird" })

export { DATA_KEY }

export function readData(): AppData {
  if (storage.getString(MIGRATION_KEY) !== "complete") {
    throw new Error("Data migration must finish first")
  }

  const value = storage.getString(DATA_KEY)

  if (!value) {
    throw new Error("Saved app data is missing")
  }

  return decodeData(value)
}

/** MMKV writes are synchronous; read the latest document for each local operation. */
export function updateData(change: (data: AppData) => void): AppData {
  const data = readData()

  change(data)
  writeVerified(storage, DATA_KEY, JSON.stringify(data))

  return data
}
