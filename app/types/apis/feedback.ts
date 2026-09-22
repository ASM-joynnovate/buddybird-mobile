import { z } from "zod"

import { timestamp, uuid } from "@/types/apis/primitives"

export const createFeedbackRequestSchema = z.object({
	message: z.string().trim().min(1).max(1000),
})

export const feedbackSchema = z.object({
	id: uuid,
	user_id: uuid,
	device_id: uuid,
	message: z.string(),
	app_version: z.string(),
	created_at: timestamp,
})

export type CreateFeedbackRequest = z.infer<typeof createFeedbackRequestSchema>
export type Feedback = z.infer<typeof feedbackSchema>
