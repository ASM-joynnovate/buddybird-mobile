import { randomUUID } from "expo-crypto"
import * as Notifications from "expo-notifications"

import { registerPushToken } from "@/apis/devices"

export async function sendPushToken(token: string): Promise<void> {
	await registerPushToken(token, randomUUID())
}

export async function registerPush(): Promise<void> {
	const permission = await Notifications.getPermissionsAsync()

	if (!permission.granted) {
		return
	}

	const { data } = await Notifications.getDevicePushTokenAsync()

	await sendPushToken(String(data))
}
