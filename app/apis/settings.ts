import { z } from "zod"

import { mockServer } from "@/apis/mock/server"

const clock = z.string().regex(/^\d{2}:\d{2}$/)

const settingsSchema = z.object({
	sleep_at: clock,
	wake_at: clock,
	notify_emergency: z.boolean(),
	notify_mimicry: z.boolean(),
	notify_daily_summary: z.boolean(),
	notify_streak: z.boolean(),
	notify_station_disconnect: z.boolean(),
})

export type Settings = z.infer<typeof settingsSchema>

export type NotificationSetting = Exclude<keyof Settings, "sleep_at" | "wake_at">

export async function fetchSettings(): Promise<Settings> {
	return settingsSchema.parse(await mockServer.settings.get())
}

export async function updateSettings(
	patch: Partial<Settings>,
	_idempotencyKey: string,
): Promise<Settings> {
	return settingsSchema.parse(await mockServer.settings.update(patch))
}
