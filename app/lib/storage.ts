import { MMKV } from "react-native-mmkv"
import type { StateStorage } from "zustand/middleware"

interface RestoreError {
	error: unknown
	storeName: string
}

let restoreErrors: readonly RestoreError[] = []

export function mmkvStorage(id: string): StateStorage {
	const storage = new MMKV({ id })

	return {
		getItem: (name) => storage.getString(name) ?? null,
		setItem: (name, value) => storage.set(name, value),
		removeItem: (name) => storage.delete(name),
	}
}

export function recordRestoreError(error: unknown, storeName: string) {
	restoreErrors = [...restoreErrors, { error, storeName }]
}

export function takeRestoreErrors(): readonly RestoreError[] {
	const errors = restoreErrors

	restoreErrors = []

	return errors
}
