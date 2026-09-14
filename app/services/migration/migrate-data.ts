import AsyncStorage from "@react-native-async-storage/async-storage"
import { File } from "expo-file-system"

import { getLocales } from "expo-localization"

import { preservePhoto } from "@/services/media/files"
import { resolveRecordingUri } from "@/services/media/uri"
import { convertLegacy } from "@/services/migration/legacy/convert"
import { mergeAliasedMetrics } from "@/services/migration/legacy/word-metrics"
import { migrateRecords } from "@/services/migration/migrate-records"
import { readData, storage } from "@/services/storage/data-store"
import { DATA_KEY, MIGRATION_KEY } from "@/services/storage/keys"
import { writeVerified } from "@/services/storage/verified-write"
import { AppData } from "@/types/app-data"

let pending: Promise<AppData> | undefined

export function migrateData(): Promise<AppData> {
	if (pending) {
		return pending
	}

	pending = (async () => {
		if (storage.getString(MIGRATION_KEY) === "complete") {
			const data = readData()

			if (mergeAliasedMetrics(data)) {
				writeVerified(storage, DATA_KEY, JSON.stringify(data))
			}

			return data
		}

		const keys = (await AsyncStorage.getAllKeys()).filter(
			(key) => key.startsWith("@buddybird/") || key.startsWith("@pethub/"),
		)
		const entries = await AsyncStorage.multiGet(keys)
		const originals: Record<string, string> = {}

		for (const [key, value] of entries) {
			if (value !== null) {
				originals[key] = value
			}
		}

		const locale = getLocales()[0]?.languageCode === "ko" ? "ko" : "en"
		const data = convertLegacy(originals, locale)

		mergeAliasedMetrics(data)

		const photo = data.profile?.photoUri

		if (photo && !photo.startsWith("photo://") && new File(resolveRecordingUri(photo)).exists) {
			data.profile!.photoUri = await preservePhoto(photo, data.profile!.id)
		}

		return migrateRecords(storage, originals, locale, data)
	})().finally(() => {
		pending = undefined
	})

	return pending
}
