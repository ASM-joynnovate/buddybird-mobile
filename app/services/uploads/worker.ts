import { createCaptureWorker } from "@/services/uploads/workers/captures"
import { createWordWorker } from "@/services/uploads/workers/words"
import { UploadDependencies } from "@/types/uploads"

/** Persistence and transport are separate so a failed commit cannot authorize file deletion. */
export function createUploadWorker(dependencies: UploadDependencies) {
	const canUpload = (signal?: AbortSignal) =>
		!signal?.aborted &&
		dependencies.configured() &&
		dependencies.read().settings.uploadConsent.status === "granted" &&
		!!dependencies.identity()
	const captures = createCaptureWorker(dependencies, canUpload)
	const words = createWordWorker(dependencies, canUpload)

	return {
		triggerCaptures: captures.trigger,
		triggerWords: words.trigger,
		isUploading: () => captures.isUploading() || words.isUploading(),
	}
}
