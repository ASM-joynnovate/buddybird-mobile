import { timestampSchema, uuidSchema } from '@/types/apis/primitives';

import { z } from 'zod';

import { FEEDBACK_MESSAGE_LIMIT } from '@/config';

const createFeedbackRequestSchema = z.object({
	message: z.string().trim().min(1).max(FEEDBACK_MESSAGE_LIMIT),
});

export const feedbackSchema = z.object({
	id: uuidSchema,
	user_id: uuidSchema,
	device_id: uuidSchema,
	message: z.string(),
	app_version: z.string(),
	created_at: timestampSchema,
});

export type CreateFeedbackRequest = z.infer<typeof createFeedbackRequestSchema>;
export type Feedback = z.infer<typeof feedbackSchema>;
