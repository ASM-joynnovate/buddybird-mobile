import { type CreateFeedbackRequest, type Feedback, feedbackSchema } from '@/types/apis/feedback';

import { apiRequest } from '@/lib/api';

export const postFeedback = async ({
	data,
	idempotencyKey,
}: {
	data: CreateFeedbackRequest;
	idempotencyKey: string;
}): Promise<Feedback> => {
	const { data: feedback } = await apiRequest('/api/v1/feedback', feedbackSchema, {
		method: 'POST',
		json: data,
		idempotencyKey,
	});

	return feedback;
};
