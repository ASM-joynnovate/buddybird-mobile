import { mutationOptions } from '@tanstack/react-query';

import { postFeedback } from '@/apis/feedback';

import type { CreateFeedbackRequest } from '@/types/apis/feedback';

import { apiKeys } from '@/hooks/apis/keys';

export const feedbackMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('feedback', 'create'),
		mutationFn: ({ input, idempotencyKey }: { input: CreateFeedbackRequest; idempotencyKey: string }) =>
			postFeedback({ data: input, idempotencyKey }),
		retry: false,
	});
