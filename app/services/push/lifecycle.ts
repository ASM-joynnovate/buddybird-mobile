import {
	type FirebaseMessagingTypes,
	getInitialNotification,
	getMessaging,
	onMessage,
	onNotificationOpenedApp,
	onTokenRefresh,
} from "@react-native-firebase/messaging"

import { mergePushReceipts, saveReceipt, setPushInteractive } from "@/services/push/receipts"
import { authorization, registerPush } from "@/services/push/registration"
import { readData, updateData } from "@/services/storage/data-store"
import { reportError } from "@/services/telemetry/client"
import type { PushReceipt } from "@/types/push"

export function startPush() {
	if (!readData().profile) {
		return () => {}
	}

	setPushInteractive(true)
	mergePushReceipts()
	const safeReceipt = (
		message: FirebaseMessagingTypes.RemoteMessage,
		source: PushReceipt["source"],
	) => {
		try {
			saveReceipt(message, source)
		} catch (error) {
			reportError(error, "push_receipt")
		}
	}

	const messaging = getMessaging()
	const foreground = onMessage(messaging, (message) => safeReceipt(message, "foreground"))
	const opened = onNotificationOpenedApp(messaging, (message) =>
		safeReceipt(message, "notification_opened"),
	)
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

	void getInitialNotification(messaging)
		.then((message) => {
			if (message) {
				safeReceipt(message, "notification_opened")
			}
		})
		.catch((error) => reportError(error, "push_initial"))
	void registerPush().catch((error) => reportError(error, "push_registration"))

	return () => {
		setPushInteractive(false)
		foreground()
		opened()
		refresh()
	}
}
