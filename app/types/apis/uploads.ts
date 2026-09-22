import { z } from "zod"

import { uuid } from "@/types/apis/primitives"

export const uploadRequestSchema = z.object({
	content_type: z.string(),
	file_size: z.number().int().positive(),
})

export const uploadSchema = z.object({
	file_id: uuid,
	url: z.string(),
	headers: z.record(z.string(), z.string()),
	expires_in: z.number().int(),
})

export type UploadRequest = z.infer<typeof uploadRequestSchema>
export type Upload = z.infer<typeof uploadSchema>
