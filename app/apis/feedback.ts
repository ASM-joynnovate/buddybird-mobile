import { type CreateFeedbackRequest, type Feedback, feedbackSchema } from '@/types/apis/feedback';

import { mockServer } from '@/mocks/server';

export const postFeedback = async ({
	data,
	idempotencyKey,
}: {
	data: CreateFeedbackRequest;
	idempotencyKey: string;
}): Promise<Feedback> => {
	return feedbackSchema.parse(await mockServer.feedback.create(data.message));
};
