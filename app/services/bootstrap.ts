import { getLocales } from "expo-localization"
import * as SplashScreen from "expo-splash-screen"

import { initI18n } from "@/i18n"
import { configureApi } from "@/lib/api"
import { mockServer } from "@/mocks/server"
import { accessToken, installUnauthorizedSignOut } from "@/services/auth/session"
import { clientDeviceId } from "@/services/device/identity"
import { getIsHeadless } from "@/services/push/background"
import { reportError } from "@/services/telemetry/client"

configureApi({ deviceId: clientDeviceId, accessToken, report: reportError })
installUnauthorizedSignOut()
mockServer.configure(clientDeviceId())

void SplashScreen.preventAutoHideAsync().catch((error) => reportError(error, "splash_screen"))

// Register the translation instance before the first useTranslation hook renders.
const i18nReady = initI18n(getLocales()[0]?.languageCode === "ko" ? "ko" : "en")

export async function bootstrap() {
	await i18nReady

	if (await getIsHeadless()) {
		return "headless" as const
	}

	return "ready" as const
}
