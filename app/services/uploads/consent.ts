import { updateData } from "@/services/storage/data-store"
import { reportError } from "@/services/telemetry/client"
import { triggerUploads } from "@/services/uploads/queue"

export async function setUploadConsent(status: "granted" | "denied") {
	updateData((data) => {
		data.settings.uploadConsent = {
			status,
			decidedAt: new Date().toISOString(),
			noticeVersion: 1,
		}
	})

	if (status === "granted") {
		void triggerUploads("consent").catch((error) => reportError(error, "consent_upload"))
	}
}
