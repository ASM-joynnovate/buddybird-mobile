import { readDeviceSetting, saveDeviceSetting } from "@/services/storage/device-settings"

export function dismissUpdate(latestVersion: string) {
	saveDeviceSetting("update", {
		...readDeviceSetting("update"),
		dismissedVersion: latestVersion,
	})
}
