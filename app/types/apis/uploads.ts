import { z } from "zod"

import { uuid } from "@/types/apis/primitives"
import { MIB } from "@/utils/units"

export const MAX_UPLOAD_BYTES = 5 * MIB
export const PHOTO_TYPES = ["image/jpeg", "image/png"]
export const RECORDING_TYPES = [
	"audio/mp4",
	"audio/x-m4a",
	"audio/m4a",
	"audio/wav",
	"audio/x-wav",
	"audio/mpeg",
]

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
