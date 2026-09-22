import { z } from "zod"

import { mockServer } from "@/apis/mock/server"
import { type Page, pageMetaSchema } from "@/types/api"

const notificationSchema = z.object({
	id: z.uuid(),
	kind: z.enum([
		"emergency",
		"mimicry",
		"station_disconnect",
		"daily_summary",
		"streak",
		"notice",
	]),
	title: z.string(),
	body: z.string(),
	sent_at: z.iso.datetime({ offset: true }),
	read_at: z.iso.datetime({ offset: true }).nullable(),
	image_url: z.string().nullable(),
	session_id: z.uuid().nullable(),
	emergency_event_id: z.uuid().nullable(),
	sound_id: z.uuid().nullable(),
	report_date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.nullable(),
	notice_id: z.uuid().nullable(),
})

export type AppNotification = z.infer<typeof notificationSchema>

export async function fetchNotifications(page: number): Promise<Page<AppNotification>> {
	const { data, meta } = await mockServer.notifications.list(page)

	return { data: z.array(notificationSchema).parse(data), meta: pageMetaSchema.parse(meta) }
}

export async function markNotificationRead(id: string, _idempotencyKey: string): Promise<void> {
	await mockServer.notifications.read(id)
}

export async function markAllNotificationsRead(_idempotencyKey: string): Promise<void> {
	await mockServer.notifications.readAll()
}
