import { mutationOptions } from "@tanstack/react-query"

import { submitFeedback } from "@/apis/feedback"
import { apiKeys } from "@/hooks/apis/keys"
import type { CreateFeedbackRequest } from "@/types/apis/feedback"

export const feedbackMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("feedback", "create"),
		mutationFn: ({
			input,
			idempotencyKey,
		}: {
			input: CreateFeedbackRequest
			idempotencyKey: string
		}) => submitFeedback(input, idempotencyKey),
		retry: false,
	})
