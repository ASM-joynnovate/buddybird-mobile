import { sendCaptureBatch } from "@/apis/captures"
import { uploadOrigin } from "@/apis/collection/request"
import { currentIdentity } from "@/apis/identity"
import { sendWordReference } from "@/apis/words"
import { drainFileDeletes } from "@/services/media/cleanup"
import { inspect } from "@/services/media/inspect"
import { readData, updateData } from "@/services/storage/data-store"
import { reportError, track } from "@/services/telemetry/client"
import { createUploadWorker } from "@/services/uploads/worker"
import type { Capture } from "@/types/capture"
import type { UploadTrigger } from "@/types/uploads"

const age = (capture: Capture) => {
	const at = Date.parse(capture.capturedAt)

	return Number.isFinite(at) ? Math.max(0, Date.now() - at) : undefined
}

const worker = createUploadWorker({
	read: readData,
	update: updateData,
	identity: currentIdentity,
	configured: () => !!uploadOrigin(),
	inspect,
	sendWord: sendWordReference,
	sendCaptures: sendCaptureBatch,
	cleanup: drainFileDeletes,
	resolved: ({ capture, status }, batchSize, retrySingle, httpStatus) => {
		if (status === "success") {
			track("capture_upload_succeeded", {
				client_capture_id: capture.id,
				latency_ms: age(capture),
				batch_size: batchSize,
				is_retry_single: retrySingle,
			})
		} else {
			track("capture_upload_failed", {
				client_capture_id: capture.id,
				reason: "server_reject",
				age_ms: age(capture),
				http_status: httpStatus,
			})
		}
	},
	aborted: (reason, succeeded, status) => {
		let pending: number | undefined

		try {
			pending = Object.keys(readData().captures).length
		} catch {
			/* Storage may be the failure. */
		}

		track("capture_flush_aborted", {
			reason,
			succeeded_before_abort: succeeded,
			pending_count: pending,
			http_status: status,
		})
	},
	rejectedWord: (_word, response) => {
		const code =
			response.body && typeof response.body === "object" && "error_code" in response.body
				? response.body.error_code
				: null

		reportError(
			new Error(
				`Reference rejected: HTTP ${response.status}${typeof code === "string" ? ` (${code})` : ""}`,
			),
			"reference_upload",
		)
	},
	error: (error) => reportError(error, "upload"),
})

export const isUploading = worker.isUploading

export const queueWordUpload = (id: string) => worker.triggerWords(false, id)

export function triggerUploads(reason: UploadTrigger, signal?: AbortSignal) {
	const captures = worker.triggerCaptures(reason, signal)
	const words =
		reason === "cold_start" || reason === "consent"
			? worker.triggerWords(true, undefined, signal)
			: Promise.resolve()

	return Promise.all([captures, words]).then(() => {})
}
