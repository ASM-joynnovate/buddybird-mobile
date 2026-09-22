import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { initI18n } from "@/i18n"
import { reportError, setUserProperties, track } from "@/services/telemetry/client"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import type { Locale } from "@/types/locale"

export function useAppLanguage(): {
	locale: Locale
	error: string | null
	changeLanguage(next: Locale): Promise<void>
} {
	const queryClient = useQueryClient()

	const { t } = useTranslation()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const [error, setError] = useState<string | null>(null)

	async function changeLanguage(next: Locale) {
		if (locale === next) {
			return
		}

		try {
			useDeviceSettingsStore.getState().setLocale(next)

			await initI18n(next)

			void queryClient.invalidateQueries()

			setUserProperties({ locale: next })
			track("language_changed", { from: locale, to: next })

			setError(null)
		} catch (cause) {
			reportError(cause, "change_language")

			setError(t("settings.general.languageError"))
		}
	}

	return { locale, error, changeLanguage }
}
