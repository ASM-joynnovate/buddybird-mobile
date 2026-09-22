import { getMessaging, onTokenRefresh } from "@react-native-firebase/messaging"

import { authorization, registerPush } from "@/services/push/registration"
import { readData, updateData } from "@/services/storage/data-store"
import { reportError } from "@/services/telemetry/client"

export function startPush() {
	if (!readData().profile) {
		return () => {}
	}

	const messaging = getMessaging()
	const refresh = onTokenRefresh(messaging, async (token) => {
		try {
			const authorizationStatus = await authorization(false)

			updateData((data) => {
				data.settings.push = {
					token,
					authorizationStatus,
					updatedAt: new Date().toISOString(),
				}
			})
		} catch (error) {
			reportError(error, "push_token")
		}
	})

	void registerPush().catch((error) => reportError(error, "push_registration"))

	return refresh
}
