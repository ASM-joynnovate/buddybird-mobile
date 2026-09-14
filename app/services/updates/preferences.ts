import { updateData } from "@/services/storage/data-store"

export function dismissUpdate(latestVersion: string) {
	updateData((data) => {
		data.settings.update.dismissedVersion = latestVersion
	})
}
