import { z } from "zod"

import { clock } from "@/types/apis/primitives"

const sleepSchema = z.object({ sleep_at: clock, wake_at: clock })

const notificationsSchema = z.object({
	emergency: z.boolean(),
	mimicry: z.boolean(),
	daily_summary: z.boolean(),
	streak: z.boolean(),
	station_disconnect: z.boolean(),
})

export const settingsSchema = z.object({
	sleep: sleepSchema,
	notifications: notificationsSchema,
})

export const updateSleepRequestSchema = sleepSchema

export const updateNotificationsRequestSchema = notificationsSchema

export type Settings = z.infer<typeof settingsSchema>
export type SleepSettings = z.infer<typeof sleepSchema>
export type NotificationSettings = z.infer<typeof notificationsSchema>
export type NotificationSetting = keyof NotificationSettings
