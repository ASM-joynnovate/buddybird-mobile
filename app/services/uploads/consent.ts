import { updateData } from "@/services/storage/data-store"

export async function setUploadConsent(status: "granted" | "denied") {
	updateData((data) => {
		data.settings.uploadConsent = {
			status,
			decidedAt: new Date().toISOString(),
			noticeVersion: 1,
		}
	})
}
