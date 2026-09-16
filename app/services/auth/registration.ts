import { deviceStorage } from "@/services/storage/device-settings"

const key = "auth/registeredUser"

export function registeredUser() {
	return deviceStorage.getString(key) ?? null
}

export function markRegistered(userId: string) {
	deviceStorage.set(key, userId)
}

export function clearRegistration() {
	deviceStorage.delete(key)
}
