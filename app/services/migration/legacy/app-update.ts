import { DeviceSettings } from "@/types/device-settings"
import { ObjectValue, readNullableText, requireNonnegativeNumber } from "@/utils/validation"

export function parseLegacyUpdate(update: ObjectValue): DeviceSettings["update"] {
	return {
		dismissedVersion: readNullableText(update.dismissedVersion, "dismissedVersion"),
		lastCheckedAt:
			update.lastCheckedAt === null
				? null
				: requireNonnegativeNumber(update.lastCheckedAt, "lastCheckedAt"),
	}
}
