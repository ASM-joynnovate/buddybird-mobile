import { type PropsWithChildren, useMemo, useState } from "react"

import { FeedbackContext, type FeedbackSource } from "@/context/feedback"

export function FeedbackProvider({ children }: PropsWithChildren) {
	const [source, setSource] = useState<FeedbackSource | null>(null)
	const value = useMemo(
		() => ({ source, open: setSource, close: () => setSource(null) }),
		[source],
	)

	return (
		<FeedbackContext.Provider value={value}>
			{children}
		</FeedbackContext.Provider>
	)
}
