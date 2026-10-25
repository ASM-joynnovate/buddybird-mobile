import { Platform } from 'react-native';

import { ApiError } from '@/types/apis/common';
import type { Parrot } from '@/types/apis/parrots';

import type { AnalyticsConsent } from '@/types/analytics-consent';
import type { DeviceSettings } from '@/types/device-settings';
import type { RemoteConfigValues } from '@/types/remote-config';
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
import * as Sentry from '@sentry/react-native';
import { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import * as Clarity from 'react-native-clarity';

import { env } from '@/config/env';
import { FIREBASE_NAME_LIMIT, firebaseParameters, sendTelemetrySafely } from '@/services/telemetry/events';
import { ageMonths } from '@/utils/date';
import { isSpeciesId } from '@/utils/species';

type UserPropertyStrings = Record<string, string | null>;

const CLARITY_TEXT_LIMIT = 255;

export const navigationIntegration = Sentry.reactNavigationIntegration({
	enableTimeToInitialDisplay: true,
});

Sentry.init({
	enabled: !__DEV__,
	environment: env.isProduction ? 'prod' : 'dev',
	enableLogs: true,
	replaysOnErrorSampleRate: 1.0,
	integrations: [Sentry.mobileReplayIntegration(), navigationIntegration],
	beforeSend: (event, hint) => {
		if (hint.originalException instanceof ApiError) {
			return {
				...event,
				fingerprint: ['{{ default }}', String(hint.originalException.status), hint.originalException.code],
			};
		}

		return event;
	},
});

const clarityConfigured = env.clarityProjectId.trim() !== '';

let telemetryAllowed: boolean | null = null;
let initialization: Promise<AnalyticsConsent> | undefined;
let clarityStarted = false;

let userProperties: UserPropertyStrings = {};
let userId: string | null = null;
let currentScreen: string | null = null;

/** Clarity 태그 전송 함수 */
const setClarityTag = async (key: string, value: string) => {
	const text = value.slice(0, CLARITY_TEXT_LIMIT).trim();

	if (text) {
		await Clarity.setCustomTag(key.slice(0, CLARITY_TEXT_LIMIT), text);
	}
};

/** 사용자 속성 전송 함수 */
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

/** 사용자 ID 전송 함수 */
const sendUserId = async () => {
	await setUserId(getAnalytics(), userId);

	await setCrashlyticsUserId(getCrashlytics(), userId ?? '');

	if (clarityStarted && userId !== null) {
		await Clarity.setCustomUserId(userId);
	}
};

/** 분석 허용 여부에 따라 Clarity 녹화 제어 함수 */
const pauseOrResumeClarity = async () => {
	if (!clarityStarted) {
		return;
	}

	await (telemetryAllowed === true ? Clarity.resume() : Clarity.pause());
};

/** Clarity 시작 함수 */
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

/** iOS 앱 추적 허용 상태를 반환하는 함수 */
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

/** 분석 도구 초기화 함수 */
export const initializeTelemetry = (shouldRequestATT = true) => {
	initialization ??= (async () => {
		const consent = await getAnalyticsConsent(shouldRequestATT);

		telemetryAllowed = consent === 'granted' || consent === 'not_applicable';

		await setAnalyticsCollectionEnabled(getAnalytics(), telemetryAllowed);
		await setCrashlyticsCollectionEnabled(getCrashlytics(), true);

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

/** 분석 사용자 ID 설정 함수 */
export const setTelemetryUserId = (nextUserId: string | null) => {
	userId = nextUserId;

	if (telemetryAllowed === true) {
		void sendTelemetrySafely(sendUserId);
	}
};

/** 사용자 속성 설정 함수 */
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

/** 사용자 속성 동기화 함수 */
export const syncUserProperties = (parrot: Parrot | null, wordCount: number, locale: DeviceSettings['locale']) => {
	setUserProperties({
		parrot_species: parrot ? (isSpeciesId(parrot.species) ? parrot.species : 'custom') : null,
		parrot_age_months: parrot ? ageMonths(parrot.birthdate) : null,
		total_words_registered: wordCount,
		locale,
	});
};

/** 분석 이벤트 전송 함수 */
export const track = <K extends keyof AnalyticsEvents>(name: K, eventParams: AnalyticsEvents[K]) => {
	if (telemetryAllowed !== true) {
		return;
	}

	void sendTelemetrySafely(async () => {
		logEvent(getAnalytics(), name.slice(0, FIREBASE_NAME_LIMIT), firebaseParameters(eventParams));

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

/** screen_view 이벤트 전송 함수 */
export const trackScreen = (name: string, screenClass = name) => {
	currentScreen = name;

	track('screen_view', { screen_name: name, screen_class: screenClass });
};

/** 오류 보고 함수 */
export const reportError = (error: unknown, scope: string, fatal?: boolean) => {
	const reportedError = error instanceof Error ? error : new Error('UnknownError');
	const attributes = {
		scope,
		...(currentScreen ? { screen_name: currentScreen } : {}),
		...(fatal === undefined ? {} : { is_fatal: String(fatal) }),
	};

	void sendTelemetrySafely(() =>
		setAttributes(getCrashlytics(), attributes).then(() => recordError(getCrashlytics(), reportedError)),
	);

	Sentry.captureException(reportedError, { tags: attributes });

	track('app_error', { error_code: reportedError.name, screen_name: currentScreen });
};

/** Remote Config 값 Sentry 기록 함수 */
export const recordRemoteConfig = (configValues: RemoteConfigValues) => {
	const attributeEntries = Object.entries(configValues).map(
		([key, value]) => [`remote_config.${key}`, value] as const,
	);

	Sentry.setTags(Object.fromEntries(attributeEntries.map(([key, value]) => [key, String(value)])));
	Sentry.setAttributes(Object.fromEntries(attributeEntries));
};
