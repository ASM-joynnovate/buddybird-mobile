import { getLocales } from "expo-localization"
import * as SplashScreen from "expo-splash-screen"

import { initializeUpdateCache } from "@/apis/app-update"
import { initI18n } from "@/i18n"
import { getIsHeadless } from "@/services/push/background"
import { reportError } from "@/services/telemetry/client"

void SplashScreen.preventAutoHideAsync().catch((error) => reportError(error, "splash_screen"))

// Register the translation instance before the first useTranslation hook renders.
const i18nReady = initI18n(getLocales()[0]?.languageCode === "ko" ? "ko" : "en")

export async function bootstrap() {
	await i18nReady

	if (await getIsHeadless()) {
		return "headless" as const
	}

	await initializeUpdateCache()

	return "ready" as const
}
