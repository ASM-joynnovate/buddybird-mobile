import type { Capture } from "@/types/capture"
import { CaptureOutcome, UploadResponse } from "@/types/uploads"

export function captureOutcomes(sent: Capture[], response: UploadResponse): CaptureOutcome[] {
	if (
		response.status < 200 ||
		response.status >= 300 ||
		!response.body ||
		typeof response.body !== "object"
	) {
		return []
	}

	const data = (response.body as { data?: unknown }).data

	if (!data || typeof data !== "object" || Array.isArray(data)) {
		return []
	}

	return sent.flatMap((capture) => {
		const entry = (data as Record<string, unknown>)[capture.id]
		const status =
			entry && typeof entry === "object" ? (entry as { status?: unknown }).status : null

		return status === "success" || status === "rejected" ? [{ capture, status }] : []
	})
}
