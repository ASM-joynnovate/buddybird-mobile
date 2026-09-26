import * as SplashScreen from "expo-splash-screen"
import { Alert } from "react-native"

import i18next, { initI18n } from "@/i18n"
import { configureApi } from "@/lib/api"
import { takeRestoreErrors } from "@/lib/storage"
import { mockServer } from "@/mocks/server"
import { accessToken, installUnauthorizedSignOut } from "@/services/auth/session"
import { loadLegacy } from "@/services/migration/upload-legacy"
import { getIsHeadless } from "@/services/push/background"
import { reportError } from "@/services/telemetry/client"
import { useAccountStore } from "@/stores/account"
import { useDeviceSettingsStore } from "@/stores/device-settings"

const { ensureClientDeviceId } = useAccountStore.getState()
const locale = () => useDeviceSettingsStore.getState().locale

configureApi({ deviceId: ensureClientDeviceId, locale, accessToken, report: reportError })

installUnauthorizedSignOut()

mockServer.configure(ensureClientDeviceId(), locale)

void SplashScreen.preventAutoHideAsync().catch((error) => reportError(error, "splash_screen"))

// Register the translation instance before the first useTranslation hook renders.
const i18nReady = initI18n(useDeviceSettingsStore.getState().locale)

export async function bootstrap() {
	await i18nReady

	const restoreErrors = takeRestoreErrors()

	for (const { error, storeName } of restoreErrors) {
		reportError(error, `restore_${storeName}`)
	}

	if (await getIsHeadless()) {
		return "headless" as const
	}

	try {
		await loadLegacy()
		await initI18n(locale())
	} catch (error) {
		reportError(error, "legacy_load")
	}

	if (restoreErrors.length > 0) {
		Alert.alert(i18next.t("app.storage.settingError"))
	}

	return "ready" as const
}
