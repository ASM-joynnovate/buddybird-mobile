export const storageIds = {
	device: "buddybird.device",
	legacyData: "buddybird",
} as const

export const persistKeys = {
	deviceSettings: { name: "device-settings", version: 1 },
	account: { name: "account", version: 1 },
} as const

export function queryCacheStorageId(accountId: string): string {
	return `buddybird.query.${accountId}`
}

export const DATA_KEY = "buddybird.data"

export const PREVIOUS_DATA_KEY = "buddybird.data.v1"

export const SOURCE_KEY = "buddybird.migration-source.v1"

export const MIGRATION_KEY = "buddybird.migration.v1"
