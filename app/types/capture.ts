export const CAPTURE_STORAGE_LIMIT_BYTES = 500 * 1024 * 1024

export type Capture = {
	id: string
	sessionId: string
	wordId: string
	clientWordId: string
	parrotSpecies: string | null
	parrotBirthdate: string | null
	cycle: number
	phase: "learning" | "rest"
	capturedAt: string
	uri: string
	fileName: string
	segments: { startMs: number; endMs: number }[]
	sizeBytes: number
}
