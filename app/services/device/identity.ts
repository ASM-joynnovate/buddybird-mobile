import { randomUUID } from "expo-crypto"

import { deviceStorage } from "@/services/storage/device-settings"

const key = "device/clientId"

export function clientDeviceId(): string {
	const saved = deviceStorage.getString(key)

	if (saved) {
		return saved
	}

	const created = randomUUID()

	deviceStorage.set(key, created)

	return created
}
