import { AppData } from "@/types/app-data"
import { ObjectValue, readNullableText, requireNonnegativeNumber } from "@/utils/validation"

export function applyLegacyUpdate(data: AppData, update: ObjectValue | undefined) {
	if (update) {
		data.settings.update = {
			dismissedVersion: readNullableText(update.dismissedVersion, "dismissedVersion"),
			lastCheckedAt:
				update.lastCheckedAt === null
					? null
					: requireNonnegativeNumber(update.lastCheckedAt, "lastCheckedAt"),
		}
	}
}
