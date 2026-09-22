import * as AppleAuthentication from "expo-apple-authentication"
import { getLocales } from "expo-localization"
import { Platform } from "react-native"

import { useAccountStore } from "@/stores/account"
import type { LoginProvider } from "@/types/account"

export async function availableLoginProviders(): Promise<LoginProvider[]> {
	const locale = getLocales()[0]
	const korean = locale?.regionCode === "KR" || locale?.languageCode === "ko"
	const kakao = korean || useAccountStore.getState().lastLogin === "kakao"

	const apple =
		Platform.OS === "ios" && (await AppleAuthentication.isAvailableAsync().catch(() => false))

	return [
		"google",
		...(kakao ? (["kakao"] as const) : []),
		...(apple ? (["apple"] as const) : []),
	]
}
