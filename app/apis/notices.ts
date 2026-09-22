import { z } from "zod"

import { mockServer } from "@/apis/mock/server"

export const noticeSchema = z.object({
	id: z.uuid(),
	title: z.string(),
	body: z.string().nullable(),
	starts_at: z.iso.datetime({ offset: true }),
	images: z.array(z.object({ url: z.string() })),
	is_read: z.boolean(),
})

export type Notice = z.infer<typeof noticeSchema>

export async function fetchNotices(): Promise<Notice[]> {
	return z.array(noticeSchema).parse(await mockServer.notices.list())
}

export async function fetchNotice(id: string): Promise<Notice> {
	return noticeSchema.parse(await mockServer.notices.get(id))
}

export async function markNoticeRead(id: string, _idempotencyKey: string): Promise<void> {
	await mockServer.notices.read(id)
}
