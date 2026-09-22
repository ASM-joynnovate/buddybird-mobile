import type { PersistedClient, Persister } from "@tanstack/query-persist-client-core"
import { MMKV } from "react-native-mmkv"

const CACHE_KEY = "query-cache"

export function createQueryPersister(storageId: string): Persister {
	const storage = new MMKV({ id: storageId })

	return {
		persistClient: (client) => {
			storage.set(CACHE_KEY, JSON.stringify(client))
		},

		restoreClient: () => {
			const saved = storage.getString(CACHE_KEY)

			return saved === undefined ? undefined : (JSON.parse(saved) as PersistedClient)
		},

		removeClient: () => {
			storage.delete(CACHE_KEY)
		},
	}
}
