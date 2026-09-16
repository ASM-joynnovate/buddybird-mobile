import type { Store } from "@/types/storage"

export function writeVerified(store: Store, key: string, value: string) {
	store.set(key, value)

	if (store.getString(key) !== value) {
		throw new Error(`Storage verification failed: ${key}`)
	}
}
