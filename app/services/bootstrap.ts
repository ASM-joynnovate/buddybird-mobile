import { getLocales } from "expo-localization"

import * as SplashScreen from "expo-splash-screen"

import { initializeUpdateCache } from "@/apis/app-update"
import { initI18n } from "@/i18n"
import { migrateData } from "@/services/migration/migrate-data"
import { getIsHeadless } from "@/services/push/background"
import { mergePushReceipts } from "@/services/push/receipts"
import { recoverNativeData } from "@/services/session/session"
import { seedPresets } from "@/services/words/presets"

void SplashScreen.preventAutoHideAsync().catch(() => {})

// Register the translation instance before the first useTranslation hook renders.
const i18nReady = initI18n(getLocales()[0]?.languageCode === "ko" ? "ko" : "en")

export async function bootstrap() {
	await i18nReady

	if (await getIsHeadless()) {
		return "headless" as const
	}

	const data = await migrateData()

	await initI18n(data.settings.locale)
	await initializeUpdateCache()
	seedPresets()
	await recoverNativeData()
	mergePushReceipts()

	return "ready" as const
}
