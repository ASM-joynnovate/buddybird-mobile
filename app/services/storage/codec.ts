import { AppData } from "@/types/app-data"
import { requireRecord } from "@/utils/validation"

export function decodeData(serialized: string): AppData {
	const value = requireRecord(JSON.parse(serialized), "app data")

	if (value.version !== 1) {
		throw new Error("Unsupported app data version")
	}

	for (const key of [
		"words",
		"wordAliases",
		"history",
		"progress",
		"captures",
		"sessionDrafts",
		"settings",
	]) {
		requireRecord(value[key], key)
	}

	if (value.profile !== null) {
		requireRecord(value.profile, "profile")
	}

	if (
		!Array.isArray(value.nativeCaptureReceipts) ||
		!Array.isArray(value.pendingWords) ||
		!Array.isArray(value.pendingFileDeletes)
	) {
		throw new Error("Invalid upload queue")
	}

	return value as AppData
}
