import { Platform } from 'react-native';

import type { Parrot } from '@/types/apis/parrots';

import type { AnalyticsConsent } from '@/types/analytics-consent';
import type { AnalyticsEvents, UserProperties } from '@/types/telemetry';

import {
	getAnalytics,
	logEvent,
	setAnalyticsCollectionEnabled,
	setUserId,
	setUserProperties as setFirebaseUserProperties,
} from '@react-native-firebase/analytics';
import {
	getCrashlytics,
	recordError,
	setAttributes,
	setCrashlyticsCollectionEnabled,
	setUserId as setCrashlyticsUserId,
} from '@react-native-firebase/crashlytics';
import { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import * as Clarity from 'react-native-clarity';

import { env } from '@/config';
import { FIREBASE_NAME_LIMIT, firebaseParameters, sendTelemetrySafely } from '@/services/telemetry/events';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { ageMonths } from '@/utils/date';

type UserPropertyStrings = Record<string, string | null>;

const CLARITY_TEXT_LIMIT = 255;

const clarityConfigured = env.clarityProjectId.trim() !== '';

let telemetryAllowed: boolean | null = null;
let initialization: Promise<AnalyticsConsent> | undefined;
let clarityStarted = false;

let userProperties: UserPropertyStrings = {};
let userId: string | null = null;
let currentScreen: string | null = null;

/** 길이 제한에 맞춰 자른 Clarity 태그 전송, 빈 값은 제외 */
const setClarityTag = async (key: string, value: string) => {
	const text = value.slice(0, CLARITY_TEXT_LIMIT).trim();

	if (text) {
		await Clarity.setCustomTag(key.slice(0, CLARITY_TEXT_LIMIT), text);
	}
};

/** 사용자 속성을 Firebase Analytics, Crashlytics, Clarity에 전송 */
const sendUserProperties = async () => {
	await setFirebaseUserProperties(getAnalytics(), userProperties);

	await setAttributes(
		getCrashlytics(),
		Object.fromEntries(
			Object.entries(userProperties).filter((entry): entry is [string, string] => entry[1] !== null),
		),
	);

	if (clarityStarted) {
		for (const [key, value] of Object.entries(userProperties)) {
			if (value !== null) {
				await setClarityTag(key, value);
			}
		}
	}
};

/** 사용자 ID를 Firebase Analytics, Crashlytics, Clarity에 전송 */
const sendUserId = async () => {
	await setUserId(getAnalytics(), userId);

	await setCrashlyticsUserId(getCrashlytics(), userId ?? '');

	if (clarityStarted && userId !== null) {
		await Clarity.setCustomUserId(userId);
	}
};

/** 분석 허용 여부에 따라 Clarity 녹화를 멈추거나 다시 시작 */
const pauseOrResumeClarity = async () => {
	if (!clarityStarted) {
		return;
	}

	await (telemetryAllowed === true ? Clarity.resume() : Clarity.pause());
};

/** Clarity 시작, 세션이 시작되면 사용자 속성과 사용자 ID 전송 */
const startClarity = () => {
	if (!clarityConfigured || clarityStarted) {
		return;
	}

	Clarity.setOnSessionStartedCallback(() => {
		void sendTelemetrySafely(async () => {
			await sendUserProperties();
			await sendUserId();
			await pauseOrResumeClarity();
		});
	});

	Clarity.initialize(env.clarityProjectId);

	clarityStarted = true;
};

/** iOS 앱 추적 허용 상태, shouldRequestATT가 참이고 아직 묻지 않았으면 요청한 결과 */
const getAnalyticsConsent = async (shouldRequestATT: boolean) => {
	if (Platform.OS !== 'ios') {
		return 'not_applicable';
	}

	let permission = await getTrackingPermissionsAsync();

	if (shouldRequestATT && permission.status === 'undetermined') {
		permission = await requestTrackingPermissionsAsync();
	}

	return permission.status === 'granted' ? 'granted' : 'denied';
};

/** 앱 추적 동의를 확인해 분석과 오류 보고 수집을 켜거나 끄고 동의 상태 반환 */
export const initializeTelemetry = (shouldRequestATT = true) => {
	initialization ??= (async () => {
		const consent = await getAnalyticsConsent(shouldRequestATT);

		useDeviceSettingsStore.getState().setAnalyticsConsent(consent);

		telemetryAllowed = consent === 'granted' || consent === 'not_applicable';

		await setAnalyticsCollectionEnabled(getAnalytics(), telemetryAllowed);
		await setCrashlyticsCollectionEnabled(getCrashlytics(), telemetryAllowed);

		if (telemetryAllowed) {
			startClarity();

			await sendTelemetrySafely(sendUserProperties);
			await sendTelemetrySafely(sendUserId);
		}

		await sendTelemetrySafely(pauseOrResumeClarity);

		return consent;
	})().finally(() => {
		initialization = undefined;
	});

	return initialization;
};

/** 분석 사용자 ID 저장, 분석을 허용했으면 전송 */
export const setTelemetryUserId = (nextUserId: string | null) => {
	userId = nextUserId;

	if (telemetryAllowed === true) {
		void sendTelemetrySafely(sendUserId);
	}
};

/** 바뀐 사용자 속성 저장, 분석을 허용했으면 전송 */
export const setUserProperties = (nextUserProperties: UserProperties) => {
	const values = Object.fromEntries(
		Object.entries(nextUserProperties).map(([key, value]) => [key, value == null ? null : String(value)]),
	);

	if (Object.entries(values).every(([key, value]) => userProperties[key] === value)) {
		return;
	}

	userProperties = { ...userProperties, ...values };

	if (telemetryAllowed === true) {
		void sendTelemetrySafely(sendUserProperties);
	}
};

/** 앵무새 종, 앵무새 나이, 등록한 단어 수, 앱 언어를 사용자 속성으로 저장 */
export const syncUserProperties = (parrot: Parrot | null, wordCount: number) => {
	setUserProperties({
		parrot_species: parrot?.species ?? null,
		parrot_age_months: parrot ? ageMonths(parrot.birthdate) : null,
		total_words_registered: wordCount,
		locale: useDeviceSettingsStore.getState().locale,
	});
};

/** 분석 이벤트를 Firebase Analytics와 Clarity에 전송 */
export const track = <K extends keyof AnalyticsEvents>(name: K, eventParams: AnalyticsEvents[K]) => {
	if (telemetryAllowed !== true) {
		return;
	}

	void sendTelemetrySafely(async () => {
		await logEvent(getAnalytics(), name.slice(0, FIREBASE_NAME_LIMIT), firebaseParameters(eventParams));

		if (!clarityStarted) {
			return;
		}

		if (name === 'screen_view') {
			await Clarity.setCurrentScreenName((eventParams as AnalyticsEvents['screen_view']).screen_name);
		}

		for (const [key, value] of Object.entries(eventParams)) {
			if (value !== null && value !== undefined) {
				await setClarityTag(`${name}.${key}`, Array.isArray(value) ? value.join(',') : String(value));
			}
		}

		await Clarity.sendCustomEvent(name);
	});
};

/** 지금 화면 이름 저장과 screen_view 이벤트 전송 */
export const trackScreen = (name: string, screenClass = name) => {
	currentScreen = name;

	track('screen_view', { screen_name: name, screen_class: screenClass });
};

/** 오류를 Crashlytics에 보고하고 app_error 이벤트 전송 */
export const reportError = (error: unknown, scope: string, fatal?: boolean) => {
	const reportedError = error instanceof Error ? error : new Error('UnknownError');
	const attributes = {
		scope,
		...(currentScreen ? { screen_name: currentScreen } : {}),
		...(fatal === undefined ? {} : { is_fatal: String(fatal) }),
	};

	if (telemetryAllowed !== false) {
		void sendTelemetrySafely(() =>
			setAttributes(getCrashlytics(), attributes).then(() => recordError(getCrashlytics(), reportedError)),
		);
	}

	track('app_error', { error_code: reportedError.name, screen_name: currentScreen });
};
