import type { LoginProvider } from '@/types/auth';
import {
	type DeviceSettings,
	deviceSettingsSchema,
	initialLegacyMigration,
	type LegacyMigration,
	type LegacySettings,
} from '@/types/device-settings';
import { defaultLocale, type Locale, locales } from '@/types/locale';

import { accountV2, mmkvStorage, storeStorageKeys, restoreOptions, storageIds } from '@/lib/storage';

import { getLocales } from 'expo-localization';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { localDate } from '@/utils/date';

type DeviceSettingsActions = {
	setLocale: (locale: Locale) => void;
	setAnalyticsConsent: (analyticsConsent: DeviceSettings['analyticsConsent']) => void;
	dismissUpdate: (version: string) => void;
	countFeedbackDay: (date?: string) => void;
	consumeFeedbackPrompt: () => void;
	setOnboardingCompleted: (onboardingCompleted: boolean) => void;
	setUsageGuideSeen: (usageGuideSeen: boolean) => void;
	setPetcamGuideSeen: (petcamGuideSeen: boolean) => void;
	setPullToRefreshUsed: (pullToRefreshUsed: boolean) => void;
	markPullToRefreshHintShown: (screenName: string) => void;
	importLegacySettings: (settings: LegacySettings) => void;
	updateLegacyMigration: (updater: (migration: LegacyMigration) => LegacyMigration) => void;
	setLastLoginProvider: (lastLoginProvider: LoginProvider) => void;
	setClientDeviceId: (clientDeviceId: string) => void;
};

type DeviceSettingsStore = DeviceSettings & DeviceSettingsActions;

/** 기기 언어에 맞는 앱 언어를 반환하는 함수 */
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

/** 기기 설정 초기값 */
const defaultDeviceSettings = (): DeviceSettings => {
	return {
		locale: deviceLocale(),
		analyticsConsent: 'unknown',
		updatePrompt: { dismissedVersion: null },
		feedbackPrompt: { formatVersion: 1, lastCountedDate: null, dayCount: 0, thresholdIndex: 0 },
		onboardingCompleted: false,
		usageGuideSeen: false,
		petcamGuideSeen: false,
		pullToRefreshUsed: false,
		pullToRefreshHintShownScreens: [],
		legacyMigration: initialLegacyMigration,
		lastLoginProvider: null,
		clientDeviceId: null,
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

			/** 피드백 요청 접속일 수 1 증가 */
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

			/** 피드백 요청 후 접속일 수 초기화 */
			consumeFeedbackPrompt: () => {
				set((state) => ({
					...state,
					feedbackPrompt: {
						...state.feedbackPrompt,
						dayCount: 0,
						thresholdIndex: state.feedbackPrompt.thresholdIndex + 1,
					},
				}));
			},

			/** 온보딩 완료 여부 저장 */
			setOnboardingCompleted: (onboardingCompleted) => {
				set((state) => ({ ...state, onboardingCompleted }));
			},

			/** 사용 안내 확인 여부 저장 */
			setUsageGuideSeen: (usageGuideSeen) => {
				set((state) => ({ ...state, usageGuideSeen }));
			},

			/** 펫캠 안내 확인 여부 저장 */
			setPetcamGuideSeen: (petcamGuideSeen) => {
				set((state) => ({ ...state, petcamGuideSeen }));
			},

			/** 당겨서 새로고침 사용 여부 저장 */
			setPullToRefreshUsed: (pullToRefreshUsed) => {
				set((state) => ({ ...state, pullToRefreshUsed }));
			},

			/** 당겨서 새로고침 안내 표시 화면 저장 */
			markPullToRefreshHintShown: (screenName) => {
				set((state) => ({
					...state,
					pullToRefreshHintShownScreens: [...state.pullToRefreshHintShownScreens, screenName],
				}));
			},

			/** v1 앱 설정 반영 */
			importLegacySettings: (settings) => {
				set((state) => ({
					...state,
					...settings,
					legacyMigration: { ...state.legacyMigration, settingsImported: true },
				}));
			},

			/** v1 데이터 업로드 진행 상태 갱신 */
			updateLegacyMigration: (updater) => {
				set((state) => ({ ...state, legacyMigration: updater(state.legacyMigration) }));
			},

			/** 마지막 로그인 방식 저장 */
			setLastLoginProvider: (lastLoginProvider) => {
				set((state) => ({ ...state, lastLoginProvider }));
			},

			/** 이 기기 ID 저장 */
			setClientDeviceId: (clientDeviceId) => {
				set((state) => ({ ...state, clientDeviceId }));
			},
		}),
		{
			name: storeStorageKeys.deviceSettings.name,
			version: storeStorageKeys.deviceSettings.version,
			storage: createJSONStorage(() => mmkvStorage(storageIds.device)),
			migrate: (persistedState, version) =>
				version < 2
					? {
							...(persistedState as object),
							lastLoginProvider: accountV2?.state.lastLoginProvider ?? null,
							clientDeviceId: accountV2?.state.clientDeviceId ?? null,
						}
					: persistedState,

			partialize: ({
				locale,
				analyticsConsent,
				updatePrompt,
				feedbackPrompt,
				onboardingCompleted,
				usageGuideSeen,
				petcamGuideSeen,
				pullToRefreshUsed,
				pullToRefreshHintShownScreens,
				legacyMigration,
				lastLoginProvider,
				clientDeviceId,
			}) => ({
				locale,
				analyticsConsent,
				updatePrompt,
				feedbackPrompt,
				onboardingCompleted,
				usageGuideSeen,
				petcamGuideSeen,
				pullToRefreshUsed,
				pullToRefreshHintShownScreens,
				legacyMigration,
				lastLoginProvider,
				clientDeviceId,
			}),

			...restoreOptions<DeviceSettingsStore>({
				schema: deviceSettingsSchema,
				storeName: storeStorageKeys.deviceSettings.name,
			}),
		},
	),
);
