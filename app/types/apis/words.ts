import { z } from "zod"

import { timestamp, uuid } from "@/types/apis/primitives"

export const MAX_RECORDINGS = 5
export const RECOMMENDED_RECORDINGS = 3
export const WORD_NAME_LIMIT = 50

const recordingSchema = z.object({ id: uuid, url: z.string(), created_at: timestamp })

export const wordSchema = z.object({
	id: uuid,
	name: z.string(),
	recordings: z.array(recordingSchema),
})

export const saveWordRequestSchema = z.object({
	name: z.string().trim().min(1).max(WORD_NAME_LIMIT),
})

export type Recording = z.infer<typeof recordingSchema>
export type Word = z.infer<typeof wordSchema>
export type SaveWordRequest = z.infer<typeof saveWordRequestSchema>
