import { z } from "zod"

import { timestamp, uuid } from "@/types/apis/primitives"

export const noticeSchema = z.object({
	id: uuid,
	title: z.string(),
	body: z.string().nullable(),
	starts_at: timestamp,
	ends_at: timestamp.nullable(),
	is_read: z.boolean(),
	images: z.array(z.object({ id: uuid, url: z.string() })),
})

export type Notice = z.infer<typeof noticeSchema>
