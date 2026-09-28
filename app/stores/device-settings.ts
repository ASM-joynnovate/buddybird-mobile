import {
	type DeviceSettings,
	deviceSettingsSchema,
	type Guide,
	initialLegacyMigration,
	type LegacyMigration,
	type LegacySettings,
} from '@/types/device-settings';
import { defaultLocale, type Locale, locales } from '@/types/locale';

import { mmkvStorage, restoreOptions } from '@/lib/storage';

import { getLocales } from 'expo-localization';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { FEEDBACK_PROMPT_THRESHOLDS } from '@/config';
import { persistKeys, storageIds } from '@/stores/keys';
import { localDate } from '@/utils/date';

type DeviceSettingsActions = {
	setLocale: (locale: Locale) => void;
	setAnalyticsConsent: (consent: DeviceSettings['analyticsConsent']) => void;
	dismissUpdate: (version: string) => void;
	countFeedbackDay: (date?: string) => void;
	consumeFeedbackPrompt: () => void;
	setGuideSeen: (guide: Guide, seen: boolean) => void;
	setOnboardingCompleted: (completed: boolean) => void;
	importLegacySettings: (settings: LegacySettings) => void;
	updateLegacyMigration: (update: (migration: LegacyMigration) => LegacyMigration) => void;
};

type DeviceSettingsStore = DeviceSettings & DeviceSettingsActions;

function deviceLocale(): Locale {
	for (const { languageTag, languageCode } of getLocales()) {
		const exact = locales.find((locale) => locale === languageTag);
		const sameLanguage = locales.find((locale) => locale.startsWith(`${languageCode}-`));
		const matched = exact ?? sameLanguage;

		if (matched) {
			return matched;
		}
	}

	return defaultLocale;
}

function defaultDeviceSettings(): DeviceSettings {
	return {
		locale: deviceLocale(),
		analyticsConsent: 'unknown',
		update: { dismissedVersion: null },
		feedback: { version: 1, lastCountedDate: null, dayCount: 0, thresholdIndex: 0 },
		guides: { recording: false },
		onboardingCompleted: false,
		legacyMigration: initialLegacyMigration,
	};
}

export const useDeviceSettingsStore = create<DeviceSettingsStore>()(
	persist(
		(set, get) => ({
			...defaultDeviceSettings(),

			setLocale: (locale) => {
				set((state) => ({ ...state, locale }));
			},

			setAnalyticsConsent: (analyticsConsent) => {
				set((state) => ({ ...state, analyticsConsent }));
			},

			dismissUpdate: (version) => {
				set((state) => ({
					...state,
					update: { ...state.update, dismissedVersion: version },
				}));
			},

			countFeedbackDay: (date = localDate()) => {
				if (get().feedback.lastCountedDate === date) {
					return;
				}

				set((state) => ({
					...state,
					feedback: {
						...state.feedback,
						lastCountedDate: date,
						dayCount: state.feedback.dayCount + 1,
					},
				}));
			},

			consumeFeedbackPrompt: () => {
				set((state) => ({
					...state,
					feedback: {
						...state.feedback,
						dayCount: 0,
						thresholdIndex: Math.min(
							state.feedback.thresholdIndex + 1,
							FEEDBACK_PROMPT_THRESHOLDS.length - 1,
						),
					},
				}));
			},

			setGuideSeen: (guide, seen) => {
				set((state) => ({ ...state, guides: { ...state.guides, [guide]: seen } }));
			},

			setOnboardingCompleted: (onboardingCompleted) => {
				set((state) => ({ ...state, onboardingCompleted }));
			},

			importLegacySettings: (settings) => {
				set((state) => ({
					...state,
					...settings,
					legacyMigration: { ...state.legacyMigration, settingsImported: true },
				}));
			},

			updateLegacyMigration: (update) => {
				set((state) => ({ ...state, legacyMigration: update(state.legacyMigration) }));
			},
		}),
		{
			name: persistKeys.deviceSettings.name,
			version: persistKeys.deviceSettings.version,
			storage: createJSONStorage(() => mmkvStorage(storageIds.device)),

			partialize: ({
				locale,
				analyticsConsent,
				update,
				feedback,
				guides,
				onboardingCompleted,
				legacyMigration,
			}) => ({
				locale,
				analyticsConsent,
				update,
				feedback,
				guides,
				onboardingCompleted,
				legacyMigration,
			}),

			...restoreOptions<DeviceSettingsStore>({
				schema: deviceSettingsSchema,
				storeName: persistKeys.deviceSettings.name,
			}),
		},
	),
);
