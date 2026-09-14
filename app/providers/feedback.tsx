import { PropsWithChildren, useState } from "react"

import { FeedbackContext, FeedbackSource } from "@/context/feedback"

export function FeedbackProvider({ children }: PropsWithChildren) {
	const [source, setSource] = useState<FeedbackSource | null>(null)

	return (
		<FeedbackContext.Provider value={{ source, open: setSource, close: () => setSource(null) }}>
			{children}
		</FeedbackContext.Provider>
	)
}
