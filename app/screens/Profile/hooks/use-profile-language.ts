import { useState } from "react"

import { useTranslation } from "react-i18next"

import { useAppData } from "@/hooks/use-app-data"
import { initI18n } from "@/i18n"
import { updateData } from "@/services/storage/data-store"
import { setUserProperties, track } from "@/services/telemetry/client"
import type { Locale } from "@/types/locale"

export function useProfileLanguage() {
	const { t } = useTranslation()
	const data = useAppData()
	const locale = data.settings.locale
	const [error, setError] = useState<string | null>(null)

	async function changeLanguage(next: Locale) {
		if (locale === next) {
			return
		}

		try {
			updateData((value) => {
				value.settings.locale = next
			})
			await initI18n(next)
			setUserProperties({ locale: next })
			track("language_changed", { from: locale, to: next })
			setError(null)
		} catch {
			setError(t("profile.languageError"))
		}
	}

	return { locale, error, changeLanguage }
}
