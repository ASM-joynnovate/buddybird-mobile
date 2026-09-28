import { invalidate } from "@/hooks/apis/invalidate"
import { apiKeys } from "@/hooks/apis/keys"
import { reportError, setUserProperties, track } from "@/services/telemetry/client"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import type { Locale } from "@/types/locale"

export function useAppLanguage(): {
	locale: Locale
	changeLanguage(next: Locale): void
} {
	const locale = useDeviceSettingsStore((state) => state.locale)

	function changeLanguage(next: Locale) {
		if (locale === next) {
			return
		}

		try {
			useDeviceSettingsStore.getState().setLocale(next)

			void invalidate(apiKeys.all())

			setUserProperties({ locale: next })
			track("language_changed", { from: locale, to: next })
		} catch (cause) {
			reportError(cause, "change_language")
		}
	}

	return { locale, changeLanguage }
}
