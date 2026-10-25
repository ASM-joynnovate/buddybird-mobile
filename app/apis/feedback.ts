import { type Feedback, feedbackSchema, type PostFeedbackParams } from '@/types/apis/feedback';

import { apiRequest } from '@/lib/api';

export const postFeedback = async ({ data, idempotencyKey }: PostFeedbackParams): Promise<Feedback> => {
	const { data: feedback } = await apiRequest('/api/v1/feedback', feedbackSchema, {
		method: 'POST',
		json: data,
		idempotencyKey,
	});

	return feedback;
};
