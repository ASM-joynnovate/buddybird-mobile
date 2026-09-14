import { useContext } from "react"

import { FeedbackContext } from "@/context/feedback"

export function useFeedbackDialog() {
	const value = useContext(FeedbackContext)

	if (!value) {
		throw new Error("AppProvider missing")
	}

	return value
}
