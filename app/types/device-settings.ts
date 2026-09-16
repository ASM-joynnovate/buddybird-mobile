import type { AnalyticsConsent } from "@/types/consent"
import type { Locale } from "@/types/locale"

export type DeviceSettings = {
	locale: Locale
	analyticsConsent: AnalyticsConsent
	update: { dismissedVersion: string | null; lastCheckedAt: number | null }
	feedback: {
		version: 1
		lastCountedDate: string | null
		dayCount: number
		thresholdIndex: number
	}
}
