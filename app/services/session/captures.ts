import type { AppData } from "@/types/app-data"

export function sessionCaptures(data: AppData, sessionId: string) {
	const all = Object.values(data.captures)
	const captures = all
		.filter((capture) => capture.sessionId === sessionId)
		.sort((a, b) => a.capturedAt.localeCompare(b.capturedAt) || a.id.localeCompare(b.id))

	return {
		captures,
		totalBytes: all.reduce((sum, capture) => sum + capture.sizeBytes, 0),
		sessionBytes: captures.reduce((sum, capture) => sum + capture.sizeBytes, 0),
	}
}
