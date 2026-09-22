import { getLocales } from "expo-localization"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { mmkvStorage, recordRestoreError } from "@/lib/storage"
import { persistKeys, storageIds } from "@/stores/keys"
import { type DeviceSettings, deviceSettingsSchema, type Guide } from "@/types/device-settings"
import { defaultLocale, type Locale, locales } from "@/types/locale"
import { localDate } from "@/utils/date"

const LAST_FEEDBACK_THRESHOLD_INDEX = 3

type DeviceSettingsActions = {
	setLocale: (locale: Locale) => void
	setAnalyticsConsent: (consent: DeviceSettings["analyticsConsent"]) => void
	dismissUpdate: (version: string) => void
	countFeedbackDay: (date?: string) => void
	consumeFeedbackPrompt: () => void
	setGuideSeen: (guide: Guide, seen: boolean) => void
}

export type DeviceSettingsStore = DeviceSettings & DeviceSettingsActions

function deviceLocale(): Locale {
	for (const { languageTag, languageCode } of getLocales()) {
		const exact = locales.find((locale) => locale === languageTag)
		const sameLanguage = locales.find((locale) => locale.startsWith(`${languageCode}-`))
		const matched = exact ?? sameLanguage

		if (matched) {
			return matched
		}
	}

	return defaultLocale
}

function defaultDeviceSettings(): DeviceSettings {
	return {
		locale: deviceLocale(),
		analyticsConsent: "unknown",
		update: { dismissedVersion: null },
		feedback: { version: 1, lastCountedDate: null, dayCount: 0, thresholdIndex: 0 },
		guides: { usage: false, placement: false, recording: false },
	}
}

export const useDeviceSettingsStore = create<DeviceSettingsStore>()(
	persist(
		(set) => ({
			...defaultDeviceSettings(),

			setLocale: (locale) => {
				set((state) => ({ ...state, locale }))
			},

			setAnalyticsConsent: (analyticsConsent) => {
				set((state) => ({ ...state, analyticsConsent }))
			},

			dismissUpdate: (version) => {
				set((state) => ({
					...state,
					update: { ...state.update, dismissedVersion: version },
				}))
			},

			countFeedbackDay: (date = localDate()) => {
				set((state) =>
					state.feedback.lastCountedDate === date
						? state
						: {
								...state,
								feedback: {
									...state.feedback,
									lastCountedDate: date,
									dayCount: state.feedback.dayCount + 1,
								},
							},
				)
			},

			consumeFeedbackPrompt: () => {
				set((state) => ({
					...state,
					feedback: {
						...state.feedback,
						dayCount: 0,
						thresholdIndex: Math.min(
							state.feedback.thresholdIndex + 1,
							LAST_FEEDBACK_THRESHOLD_INDEX,
						),
					},
				}))
			},

			setGuideSeen: (guide, seen) => {
				set((state) => ({ ...state, guides: { ...state.guides, [guide]: seen } }))
			},
		}),
		{
			name: persistKeys.deviceSettings.name,
			version: persistKeys.deviceSettings.version,
			storage: createJSONStorage(() => mmkvStorage(storageIds.device)),

			partialize: ({ locale, analyticsConsent, update, feedback, guides }) => ({
				locale,
				analyticsConsent,
				update,
				feedback,
				guides,
			}),

			merge: (persisted, current) => {
				if (persisted === undefined) {
					return current
				}

				const parsed = deviceSettingsSchema.safeParse(persisted)

				if (!parsed.success) {
					recordRestoreError(parsed.error, persistKeys.deviceSettings.name)

					return current
				}

				return { ...current, ...parsed.data }
			},

			onRehydrateStorage: () => (_state, error) => {
				if (error) {
					recordRestoreError(error, persistKeys.deviceSettings.name)
				}
			},
		},
	),
)
