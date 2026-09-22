import type { DeviceSettings } from "@/types/device-settings"
import { type ObjectValue, readNullableText } from "@/utils/validation"

export function parseLegacyUpdate(update: ObjectValue): DeviceSettings["update"] {
	return {
		dismissedVersion: readNullableText(update.dismissedVersion, "dismissedVersion"),
	}
}
