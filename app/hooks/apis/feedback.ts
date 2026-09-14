import { mutationOptions } from "@tanstack/react-query"

import { submitFeedback } from "@/apis/feedback"

export const feedbackMutationOptions = () =>
	mutationOptions({
		mutationKey: ["firebase", "feedback"],
		mutationFn: submitFeedback,
		networkMode: "always",
		retry: false,
	})
