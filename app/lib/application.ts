import * as Application from "expo-application"
import Constants from "expo-constants"
import { Linking, Platform } from "react-native"

import { config } from "@/config"

export const installedVersion =
	Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? "1.2.0"

export async function openStore() {
	const id = config.production ? "6783652711" : "6784253530"
	const appId = Application.applicationId

	if (Platform.OS !== "ios" && !appId) {
		throw new Error("Missing installed application ID")
	}

	const native =
		Platform.OS === "ios"
			? `itms-apps://apps.apple.com/app/id${id}`
			: `market://details?id=${appId}`
	const web =
		Platform.OS === "ios"
			? `https://apps.apple.com/app/id${id}`
			: `https://play.google.com/store/apps/details?id=${appId}`

	try {
		await Linking.openURL(native)
	} catch {
		await Linking.openURL(web)
	}
}
