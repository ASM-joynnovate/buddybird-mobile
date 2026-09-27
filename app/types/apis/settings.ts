import { z } from "zod"

import { clock } from "@/types/apis/primitives"

const sleepSchema = z.object({ sleep_at: clock, wake_at: clock })

const notificationsSchema = z.object({
	notice: z.boolean(),
	report: z.boolean(),
	marketing: z.boolean(),
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
