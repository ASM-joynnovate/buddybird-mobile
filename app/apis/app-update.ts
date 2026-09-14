import {
	ensureInitialized,
	fetchAndActivate,
	getRemoteConfig,
	getString,
	setConfigSettings,
	setDefaults,
} from "@react-native-firebase/remote-config"

import { config } from "@/config"
import { updateData } from "@/services/storage/data-store"
import { parseReleaseNotes, UPDATE_INTERVAL, versionParts } from "@/services/updates/policy"

export function initializeUpdateCache() {
	return ensureInitialized(getRemoteConfig())
}

export function readUpdatePolicy() {
	const remote = getRemoteConfig()
	const latestVersion = getString(remote, "latest_version").trim()
	const minimumVersion = getString(remote, "min_supported_version").trim()

	if (!versionParts(latestVersion) || (minimumVersion && !versionParts(minimumVersion))) {
		return undefined
	}

	return {
		latestVersion,
		minimumVersion,
		notes: parseReleaseNotes(getString(remote, "release_notes")),
	}
}

export async function fetchUpdatePolicy() {
	updateData((data) => {
		data.settings.update.lastCheckedAt = Date.now()
	})
	const remote = getRemoteConfig()

	await setConfigSettings(remote, {
		minimumFetchIntervalMillis: config.production ? UPDATE_INTERVAL : 0,
	})
	await setDefaults(remote, {
		latest_version: "",
		min_supported_version: "",
		release_notes: "{}",
	})
	await fetchAndActivate(remote)

	return readUpdatePolicy() ?? null
}
