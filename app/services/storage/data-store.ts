import { MMKV } from "react-native-mmkv"

import { decodeData } from "@/services/storage/codec"
import { writeVerified } from "@/services/storage/verified-write"
import { DATA_KEY, storageIds } from "@/stores/keys"
import type { AppData } from "@/types/app-data"

export const storage = new MMKV({ id: storageIds.legacyData })

export { DATA_KEY }

export function readData(): AppData {
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
	const serialized = JSON.stringify(data)

	decodeData(serialized)
	writeVerified(storage, DATA_KEY, serialized)

	return data
}
