import * as Notifications from "expo-notifications"

import { registerPush, sendPushToken } from "@/services/push/registration"
import { reportError } from "@/services/telemetry/client"

export function startPush() {
	const subscription = Notifications.addPushTokenListener(({ data }) => {
		void sendPushToken(String(data)).catch((error) => reportError(error, "push_token"))
	})

	void registerPush().catch((error) => reportError(error, "push_registration"))

	return () => subscription.remove()
}
