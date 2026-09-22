import { mockServer } from "@/apis/mock/server"
import {
	type NotificationSettings,
	type Settings,
	settingsSchema,
	type SleepSettings,
} from "@/types/apis/settings"

export async function fetchSettings(): Promise<Settings> {
	return settingsSchema.parse(await mockServer.settings.get())
}

export async function updateSleep(
	sleep: SleepSettings,
	_idempotencyKey: string,
): Promise<Settings> {
	return settingsSchema.parse(await mockServer.settings.updateSleep(sleep))
}

export async function updateNotifications(
	notifications: NotificationSettings,
	_idempotencyKey: string,
): Promise<Settings> {
	return settingsSchema.parse(await mockServer.settings.updateNotifications(notifications))
}
