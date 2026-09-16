import "intl-pluralrules"
import i18next from "i18next"
import { initReactI18next } from "react-i18next"

import { en } from "@/i18n/locales/en"
import { ko } from "@/i18n/locales/ko"
import type { Locale } from "@/types/locale"

export async function initI18n(locale: Locale) {
	if (i18next.isInitialized) {
		await i18next.changeLanguage(locale)
	} else {
		await i18next.use(initReactI18next).init({
			lng: locale,
			fallbackLng: "ko",
			resources: { ko: { translation: ko }, en: { translation: en } },
			interpolation: { escapeValue: false },
			initImmediate: false,
		})
	}
}

export default i18next
