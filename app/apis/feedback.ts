import { type CreateFeedbackRequest, type Feedback, feedbackSchema } from '@/types/apis/feedback';

import { mockServer } from '@/mocks/server';

export async function submitFeedback(input: CreateFeedbackRequest, _idempotencyKey: string): Promise<Feedback> {
	return feedbackSchema.parse(await mockServer.feedback.create(input.message));
}
