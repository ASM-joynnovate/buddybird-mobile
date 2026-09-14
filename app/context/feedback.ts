import { createContext } from "react"

export type FeedbackSource = "profile" | "prompt"

export const FeedbackContext = createContext<{
	source: FeedbackSource | null
	open(source: FeedbackSource): void
	close(): void
} | null>(null)
