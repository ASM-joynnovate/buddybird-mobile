import { deviceStorage } from "@/services/storage/device-settings"

const key = "auth/registeredUser"

export function registeredUser() {
	return deviceStorage.getString(key) ?? null
}

export function markRegistered(userId: string) {
	deviceStorage.set(key, userId)

	const provider = loginProvider()

	if (provider) {
		deviceStorage.set(lastLoginKey, provider)
	}
}

export function clearRegistration() {
	deviceStorage.delete(key)
}

export type LoginProvider = "google" | "kakao" | "apple"

const providerKey = "auth/provider"
const lastLoginKey = "auth/lastLogin"

export function loginProvider(): LoginProvider | null {
	return parseProvider(deviceStorage.getString(providerKey))
}

export function lastLoginProvider(): LoginProvider | null {
	return parseProvider(deviceStorage.getString(lastLoginKey))
}

function parseProvider(saved: string | undefined): LoginProvider | null {
	return saved === "google" || saved === "kakao" || saved === "apple" ? saved : null
}

export function markProvider(provider: LoginProvider) {
	deviceStorage.set(providerKey, provider)
}
