import { useState } from "react"

import { useTranslation } from "react-i18next"

import { useDeviceSetting } from "@/hooks/use-device-setting"
import { initI18n } from "@/i18n"
import { saveDeviceSetting } from "@/services/storage/device-settings"
import { reportError, setUserProperties, track } from "@/services/telemetry/client"
import type  { Locale } from "@/types/locale"

export function useProfileLanguage() {
	const { t } = useTranslation()
	const locale = useDeviceSetting("locale")
	const [error, setError] = useState<string | null>(null)

	async function changeLanguage(next: Locale) {
		if (locale === next) {
			return
		}

		try {
			saveDeviceSetting("locale", next)
			await initI18n(next)
			setUserProperties({ locale: next })
			track("language_changed", { from: locale, to: next })
			setError(null)
		} catch (cause) {
			reportError(cause, "change_language")
			setError(t("profile.languageError"))
		}
	}

	return { locale, error, changeLanguage }
}
