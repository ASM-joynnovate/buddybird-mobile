import {
	AuthorizationStatus,
	getMessaging,
	getToken,
	hasPermission,
	registerDeviceForRemoteMessages,
	requestPermission,
} from "@react-native-firebase/messaging"
import { PermissionsAndroid, Platform } from "react-native"

import { updateData } from "@/services/storage/data-store"
import type { PushAuthorization } from "@/types/push"

export async function authorization(request: boolean): Promise<PushAuthorization> {
	if (Platform.OS === "android") {
		if (Number(Platform.Version) < 33) {
			return "authorized"
		}

		const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS

		if (await PermissionsAndroid.check(permission)) {
			return "authorized"
		}

		if (!request) {
			return "denied"
		}

		return (await PermissionsAndroid.request(permission)) === PermissionsAndroid.RESULTS.GRANTED
			? "authorized"
			: "denied"
	}

	const messaging = getMessaging()
	let status = await hasPermission(messaging)

	if (request && status === AuthorizationStatus.NOT_DETERMINED) {
		status = await requestPermission(messaging)
	}

	switch (status) {
		case AuthorizationStatus.AUTHORIZED:
			return "authorized"
		case AuthorizationStatus.PROVISIONAL:
			return "provisional"
		case AuthorizationStatus.EPHEMERAL:
			return "ephemeral"
		case AuthorizationStatus.DENIED:
			return "denied"
		default:
			return "not_determined"
	}
}

export async function registerPush() {
	const authorizationStatus = await authorization(true)

	updateData((data) => {
		data.settings.push = {
			token:
				authorizationStatus === "denied" || authorizationStatus === "not_determined"
					? null
					: (data.settings.push?.token ?? null),
			authorizationStatus,
			updatedAt: new Date().toISOString(),
		}
	})

	if (authorizationStatus !== "authorized" && authorizationStatus !== "provisional") {
		return
	}

	const messaging = getMessaging()

	if (Platform.OS === "ios" && !messaging.isDeviceRegisteredForRemoteMessages) {
		await registerDeviceForRemoteMessages(messaging)
	}

	const token = await getToken(messaging)

	updateData((data) => {
		data.settings.push = { token, authorizationStatus, updatedAt: new Date().toISOString() }
	})
}
