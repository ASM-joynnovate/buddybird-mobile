import { z } from "zod"

import { localDate, timestamp, uuid } from "@/types/apis/primitives"

export const notificationKindSchema = z.enum([
	"emergency",
	"mimicry",
	"station_disconnect",
	"daily_summary",
	"streak",
])

export const notificationSchema = z.object({
	id: uuid,
	kind: notificationKindSchema,
	title: z.string(),
	body: z.string(),
	image: z.object({ url: z.string() }).nullable(),
	sound_id: uuid.nullable(),
	emergency_event_id: uuid.nullable(),
	report_date: localDate.nullable(),
	sent_at: timestamp,
	read_at: timestamp.nullable(),
})

export type NotificationKind = z.infer<typeof notificationKindSchema>
export type AppNotification = z.infer<typeof notificationSchema>
