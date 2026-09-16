import {
	getMessaging,
	getIsHeadless as nativeIsHeadless,
	setBackgroundMessageHandler,
} from "@react-native-firebase/messaging"
import { Platform } from "react-native"

import { saveReceipt } from "@/services/push/receipts"

// Android background messages run in a separate Headless JS task without mounting App.
export const getIsHeadless = () =>
	Platform.OS === "ios" ? nativeIsHeadless(getMessaging()) : Promise.resolve(false)

export function registerBackgroundPushHandler() {
	setBackgroundMessageHandler(getMessaging(), async (message) => {
		saveReceipt(message, "background")
	})
}
