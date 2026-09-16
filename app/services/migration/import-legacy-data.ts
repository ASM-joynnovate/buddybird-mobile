import AsyncStorage from "@react-native-async-storage/async-storage"
import { Paths } from "expo-file-system"

import { preservePhoto, preserveRecording } from "@/services/media/files"
import { inspect } from "@/services/media/inspect"
import { resolveRecordingUri } from "@/services/media/uri"
import { importLegacyRecords } from "@/services/migration/import-legacy-records"
import { readMigrationSource, type MigrationSource } from "@/services/migration/source"
import { readData, storage, updateData } from "@/services/storage/data-store"
import {
	deviceKeys,
	deviceStorage,
	readDeviceSetting,
	saveDeviceSetting,
} from "@/services/storage/device-settings"
import { DATA_KEY, MIGRATION_KEY, PREVIOUS_DATA_KEY } from "@/services/storage/keys"
import { AppData } from "@/types/app-data"

let pending: Promise<AppData> | undefined

export function importLegacyData(): Promise<AppData> {
	if (pending) {
		return pending
	}

	pending = (async () => {
		if (storage.getString(DATA_KEY) !== undefined) {
			const data = readData()

			if (data.migration.complete) {
				return data
			}
		}

		const source = await loadSource()
		const data = importLegacyRecords(storage, source, (key, value) => {
			if (deviceStorage.getString(deviceKeys[key]) === undefined) {
				saveDeviceSetting(key, value)
			} else {
				readDeviceSetting(key)
			}
		})

		await preserveMigratedMedia(data)

		return updateData((latest) => {
			latest.migration.complete = latest.migration.issues.length === 0
		})
	})().finally(() => {
		pending = undefined
	})

	return pending
}

async function loadSource(): Promise<MigrationSource> {
	const saved = readMigrationSource(storage)

	if (saved) {
		return saved
	}

	if (storage.getString(DATA_KEY) !== undefined) {
		throw new Error("Migration source is missing; existing data was retained")
	}

	const previous = storage.getString(PREVIOUS_DATA_KEY)

	if (previous !== undefined) {
		return { version: 1, kind: "mmkv", serialized: previous }
	}

	if (storage.getString(MIGRATION_KEY) === "complete") {
		throw new Error("Previous MMKV data is missing; AsyncStorage was not used as a fallback")
	}

	const keys = (await AsyncStorage.getAllKeys()).filter(
		(key) => key.startsWith("@buddybird/") || key.startsWith("@pethub/"),
	)
	const entries = await AsyncStorage.multiGet(keys)
	const values: Record<string, string> = {}

	for (const [key, value] of entries) {
		if (value !== null) {
			values[key] = value
		}
	}

	return { version: 1, kind: "async-storage", values }
}

async function preserveMigratedMedia(data: AppData) {
	async function item(key: string, apply: () => Promise<(latest: AppData) => void>) {
		if (data.migration.completed.includes(key)) {
			return
		}

		try {
			const update = await apply()

			updateData((latest) => {
				update(latest)
				latest.migration.completed.push(key)
			})
		} catch (error) {
			updateData((latest) => {
				latest.migration.issues.push({
					key,
					message: error instanceof Error ? error.message : String(error),
				})
			})
		}
	}

	const profile = data.profile

	if (profile?.photoUri) {
		const original = profile.photoUri

		await item("media/profile", async () => {
			const info = await inspect(original)

			if (!info.exists || info.size === 0) {
				throw new Error("The saved profile photo is missing")
			}

			const photo = original.startsWith("photo://")
				? original
				: await preservePhoto(original, profile.id)

			return (latest) => {
				if (latest.profile?.id === profile.id && latest.profile.photoUri === original) {
					latest.profile.photoUri = photo
				}
			}
		})
	}

	const words = [
		...Object.entries(data.words).map(([id, word]) => ({ key: `words/${id}`, word })),
		...Object.entries(data.history).map(([id, session]) => ({
			key: `history/${id}`,
			word: session.word,
		})),
		...Object.entries(data.sessionDrafts).map(([id, draft]) => ({
			key: `sessionDrafts/${id}`,
			word: draft.word,
		})),
	]
	const files = new Map<string, string>()

	for (const { key, word } of words) {
		if (word.sourceType === "recording" && !files.has(word.audioUri)) {
			files.set(word.audioUri, `${key}/original`)
		}

		if (word.transformedAudioUri && !files.has(word.transformedAudioUri)) {
			files.set(word.transformedAudioUri, `${key}/transformed`)
		}
	}

	for (const [original, key] of files) {
		await item(`media/${key}`, async () => {
			const info = await inspect(original)

			if (!info.exists || info.size === 0) {
				throw new Error(`The saved recording is missing: ${key}`)
			}

			const resolved = resolveRecordingUri(original)
			const uri = resolved.startsWith(Paths.document.uri)
				? original
				: await preserveRecording(resolved, key)

			return (latest) => {
				const references = [
					...Object.values(latest.words),
					...Object.values(latest.history).map((session) => session.word),
					...Object.values(latest.sessionDrafts).map((draft) => draft.word),
				]

				for (const word of references) {
					if (word.audioUri === original) {
						word.audioUri = uri
					}

					if (word.transformedAudioUri === original) {
						word.transformedAudioUri = uri
					}
				}
			}
		})
	}
}
