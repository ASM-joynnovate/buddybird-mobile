import { captureOutcomes } from "@/services/uploads/outcomes"
import type { Capture } from "@/types/capture"
import type {
	CaptureOutcome,
	UploadDependencies,
	UploadResponse,
	UploadTrigger,
} from "@/types/uploads"

export function createCaptureWorker(
	dependencies: UploadDependencies,
	canUpload: (signal?: AbortSignal) => boolean,
) {
	let captureUploadTask: Promise<void> | null = null
	let captureTriggerCount = 0
	let automaticCaptureRetryBlocked = false

	function saveCaptureOutcomes(
		outcomes: CaptureOutcome[],
		batchSize: number,
		retrySingle: boolean,
		httpStatus?: number,
	) {
		dependencies.update((data) => {
			for (const { capture } of outcomes) {
				if (!data.captures[capture.id]) {
					continue
				}

				delete data.captures[capture.id]

				if (!data.pendingFileDeletes.includes(capture.uri)) {
					data.pendingFileDeletes.push(capture.uri)
				}
			}
		})

		for (const outcome of outcomes) {
			dependencies.resolved(outcome, batchSize, retrySingle, httpStatus)
		}
	}

	async function uploadPendingCaptures(signal?: AbortSignal) {
		let successfulCaptureCount = 0
		const omittedIds = new Set<string>()
		const abortCaptureUpload = (
			reason: Parameters<UploadDependencies["aborted"]>[0],
			status?: number,
		) => {
			dependencies.aborted(reason, successfulCaptureCount, status)

			return false
		}

		async function uploadCaptureBatch(
			requested: Capture[],
			retrySingle = false,
		): Promise<boolean> {
			const uid = dependencies.identity()

			if (!canUpload(signal) || !uid) {
				return false
			}

			let response: UploadResponse
			let included: Capture[]

			try {
				const result = await dependencies.sendCaptures(requested, uid, signal)

				for (const id of result.omittedIds) {
					omittedIds.add(id)
				}

				included = requested.filter((capture) => result.includedIds.includes(capture.id))

				if (!result.response || !included.length) {
					return true
				}

				response = result.response
			} catch (error) {
				dependencies.error(error)

				if (signal?.aborted) {
					return false
				}

				return abortCaptureUpload(
					error instanceof TypeError ||
						(error instanceof Error &&
							["TimeoutError", "AbortError"].includes(error.name))
						? "network_error"
						: "exception",
				)
			}

			const { status } = response

			if (status >= 400 && status < 500) {
				if (included.length > 1) {
					for (const item of included) {
						if (!(await uploadCaptureBatch([item], true))) {
							return false
						}
					}

					return true
				}

				saveCaptureOutcomes(
					[{ capture: included[0], status: "rejected" }],
					1,
					retrySingle,
					status,
				)
				await dependencies.cleanup()

				return true
			}

			if (status < 200 || status >= 300) {
				return abortCaptureUpload("server_error", status)
			}

			const outcomes = captureOutcomes(included, response)

			if (!outcomes.length) {
				return abortCaptureUpload("unreadable_response", status)
			}

			saveCaptureOutcomes(outcomes, included.length, retrySingle)
			successfulCaptureCount += outcomes.filter((item) => item.status === "success").length
			await dependencies.cleanup()

			return true
		}

		try {
			await dependencies.cleanup()

			while (canUpload(signal)) {
				const orderedCaptures = Object.values(dependencies.read().captures).sort(
					(a, b) => (Date.parse(a.capturedAt) || 0) - (Date.parse(b.capturedAt) || 0),
				)
				const captureBatch: Capture[] = []
				let batchBytes = 0

				for (const capture of orderedCaptures) {
					if (omittedIds.has(capture.id)) {
						continue
					}

					let fileInfo: Awaited<ReturnType<UploadDependencies["inspect"]>>

					try {
						fileInfo = await dependencies.inspect(capture.uri)

						if (
							fileInfo.exists &&
							(!Number.isFinite(fileInfo.size) || fileInfo.size < 44)
						) {
							throw new Error("Capture unavailable: " + capture.id)
						}
					} catch (error) {
						omittedIds.add(capture.id)
						dependencies.error(error)
						continue
					}

					if (!fileInfo.exists) {
						dependencies.update((data) => {
							delete data.captures[capture.id]
						})
						continue
					}

					if (captureBatch.length > 0 && batchBytes + fileInfo.size > 9 * 1024 * 1024) {
						break
					}

					captureBatch.push(capture)
					batchBytes += fileInfo.size

					if (captureBatch.length === 10) {
						break
					}
				}

				if (!captureBatch.length) {
					return true
				}

				if (!(await uploadCaptureBatch(captureBatch))) {
					return false
				}
			}

			return true
		} catch (error) {
			dependencies.error(error)

			return abortCaptureUpload("exception")
		}
	}

	function triggerCaptures(reason: UploadTrigger, signal?: AbortSignal) {
		if (reason !== "accumulation") {
			captureTriggerCount++
			automaticCaptureRetryBlocked = false
		}

		if (captureUploadTask) {
			return captureUploadTask
		}

		if (
			reason === "accumulation" &&
			(automaticCaptureRetryBlocked || Object.keys(dependencies.read().captures).length < 10)
		) {
			return Promise.resolve()
		}

		captureUploadTask = (async () => {
			do {
				const observedTriggerCount = captureTriggerCount

				automaticCaptureRetryBlocked = !(await uploadPendingCaptures(signal))

				if (captureTriggerCount === observedTriggerCount || signal?.aborted) {
					break
				}

				automaticCaptureRetryBlocked = false
			} while (true)
		})().finally(() => {
			captureUploadTask = null
		})

		return captureUploadTask
	}

	return { trigger: triggerCaptures, isUploading: () => captureUploadTask !== null }
}
