import { mockServer } from "@/mocks/server"
import { type CreateFeedbackRequest, type Feedback, feedbackSchema } from "@/types/apis/feedback"

export async function submitFeedback(
	input: CreateFeedbackRequest,
	_idempotencyKey: string,
): Promise<Feedback> {
	return feedbackSchema.parse(await mockServer.feedback.create(input.message))
}
