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
	setAnalyticsConsent: (analyticsConsent: DeviceSettings['analyticsConsent']) => void;
	dismissUpdate: (version: string) => void;
	countFeedbackDay: (date?: string) => void;
	consumeFeedbackPrompt: () => void;
	setGuideSeen: (guide: Guide, seen: boolean) => void;
	setOnboardingCompleted: (onboardingCompleted: boolean) => void;
	importLegacySettings: (settings: LegacySettings) => void;
	updateLegacyMigration: (updater: (migration: LegacyMigration) => LegacyMigration) => void;
};

type DeviceSettingsStore = DeviceSettings & DeviceSettingsActions;

/** 기기 언어 설정 순서대로 찾은 앱 언어, 맞는 언어가 없으면 기본 언어 */
const deviceLocale = () => {
	for (const { languageTag, languageCode } of getLocales()) {
		const exact = locales.find((locale) => locale === languageTag);
		const sameLanguage = locales.find((locale) => locale.startsWith(`${languageCode}-`));
		const matched = exact ?? sameLanguage;

		if (matched) {
			return matched;
		}
	}

	return defaultLocale;
};

/** 기기 설정 처음 값 */
const defaultDeviceSettings = (): DeviceSettings => {
	return {
		locale: deviceLocale(),
		analyticsConsent: 'unknown',
		updatePrompt: { dismissedVersion: null },
		feedbackPrompt: { formatVersion: 1, lastCountedDate: null, dayCount: 0, thresholdIndex: 0 },
		seenGuides: { recording: false },
		onboardingCompleted: false,
		legacyMigration: initialLegacyMigration,
	};
};

export const useDeviceSettingsStore = create<DeviceSettingsStore>()(
	persist(
		(set, get) => ({
			...defaultDeviceSettings(),

			/** 앱 언어 저장 */
			setLocale: (locale) => {
				set((state) => ({ ...state, locale }));
			},

			/** 분석 동의 상태 저장 */
			setAnalyticsConsent: (analyticsConsent) => {
				set((state) => ({ ...state, analyticsConsent }));
			},

			/** 닫은 업데이트 안내의 버전 저장 */
			dismissUpdate: (version) => {
				set((state) => ({
					...state,
					updatePrompt: { ...state.updatePrompt, dismissedVersion: version },
				}));
			},

			/** 의견 요청 접속일 수 1 증가, 같은 날에는 한 번만 */
			countFeedbackDay: (date = localDate()) => {
				if (get().feedbackPrompt.lastCountedDate === date) {
					return;
				}

				set((state) => ({
					...state,
					feedbackPrompt: {
						...state.feedbackPrompt,
						lastCountedDate: date,
						dayCount: state.feedbackPrompt.dayCount + 1,
					},
				}));
			},

			/** 접속일 수를 0으로 되돌리고 다음 의견 요청 기준으로 이동 */
			consumeFeedbackPrompt: () => {
				set((state) => ({
					...state,
					feedbackPrompt: {
						...state.feedbackPrompt,
						dayCount: 0,
						thresholdIndex: Math.min(
							state.feedbackPrompt.thresholdIndex + 1,
							FEEDBACK_PROMPT_THRESHOLDS.length - 1,
						),
					},
				}));
			},

			/** 안내 화면 확인 여부 저장 */
			setGuideSeen: (guide, seen) => {
				set((state) => ({ ...state, seenGuides: { ...state.seenGuides, [guide]: seen } }));
			},

			/** 온보딩 완료 여부 저장 */
			setOnboardingCompleted: (onboardingCompleted) => {
				set((state) => ({ ...state, onboardingCompleted }));
			},

			/** v1 앱 설정 반영과 설정 가져오기 완료 표시 */
			importLegacySettings: (settings) => {
				set((state) => ({
					...state,
					...settings,
					legacyMigration: { ...state.legacyMigration, settingsImported: true },
				}));
			},

			/** v1 데이터 올리기 진행 상태 갱신 */
			updateLegacyMigration: (updater) => {
				set((state) => ({ ...state, legacyMigration: updater(state.legacyMigration) }));
			},
		}),
		{
			name: persistKeys.deviceSettings.name,
			version: persistKeys.deviceSettings.version,
			storage: createJSONStorage(() => mmkvStorage(storageIds.device)),

			partialize: ({
				locale,
				analyticsConsent,
				updatePrompt,
				feedbackPrompt,
				seenGuides,
				onboardingCompleted,
				legacyMigration,
			}) => ({
				locale,
				analyticsConsent,
				updatePrompt,
				feedbackPrompt,
				seenGuides,
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
