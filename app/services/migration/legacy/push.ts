import { AppData } from "@/types/app-data"
import { ObjectValue, readNullableText, requireChoice, requireText } from "@/utils/validation"

export function applyLegacyPush(data: AppData, push: ObjectValue | undefined) {
	if (push) {
		data.settings.push = {
			token: readNullableText(push.token, "token"),
			authorizationStatus: requireChoice(
				push.authorizationStatus,
				["not_determined", "denied", "authorized", "provisional", "ephemeral"] as const,
				"authorizationStatus",
			),
			updatedAt: requireText(push.updatedAt, "push.updatedAt"),
		}
	}
}
