import { z } from "zod"

import { mockServer } from "@/mocks/server"
import { type Page, pageMetaSchema } from "@/types/apis/common"
import { type Notice, noticeSchema } from "@/types/apis/notices"

export async function fetchNotices(page: number): Promise<Page<Notice>> {
	const { data, meta } = await mockServer.notices.list(page)

	return { data: z.array(noticeSchema).parse(data), meta: pageMetaSchema.parse(meta) }
}

export async function fetchNotice(id: string): Promise<Notice> {
	return noticeSchema.parse(await mockServer.notices.get(id))
}

export async function markNoticeRead(id: string, _idempotencyKey: string): Promise<Notice> {
	return noticeSchema.parse(await mockServer.notices.read(id))
}
