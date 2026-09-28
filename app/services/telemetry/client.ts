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

async function setClarityTag(key: string, value: string) {
	const text = value.slice(0, CLARITY_TEXT_LIMIT).trim();

	if (text) {
		await Clarity.setCustomTag(key.slice(0, CLARITY_TEXT_LIMIT), text);
	}
}

async function sendUserProperties() {
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
}

async function sendUserId() {
	await setUserId(getAnalytics(), userId);

	await setCrashlyticsUserId(getCrashlytics(), userId ?? '');

	if (clarityStarted && userId !== null) {
		await Clarity.setCustomUserId(userId);
	}
}

async function pauseOrResumeClarity() {
	if (!clarityStarted) {
		return;
	}

	await (telemetryAllowed === true ? Clarity.resume() : Clarity.pause());
}

function startClarity() {
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
}

async function getAnalyticsConsent(shouldRequestATT: boolean): Promise<AnalyticsConsent> {
	if (Platform.OS !== 'ios') {
		return 'not_applicable';
	}

	let permission = await getTrackingPermissionsAsync();

	if (shouldRequestATT && permission.status === 'undetermined') {
		permission = await requestTrackingPermissionsAsync();
	}

	return permission.status === 'granted' ? 'granted' : 'denied';
}

export function initializeTelemetry(shouldRequestATT = true): Promise<AnalyticsConsent> {
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
}

export function setTelemetryUserId(next: string | null) {
	userId = next;

	if (telemetryAllowed === true) {
		void sendTelemetrySafely(sendUserId);
	}
}

export function setUserProperties(next: UserProperties) {
	const values = Object.fromEntries(
		Object.entries(next).map(([key, value]) => [key, value == null ? null : String(value)]),
	);

	if (Object.entries(values).every(([key, value]) => userProperties[key] === value)) {
		return;
	}

	userProperties = { ...userProperties, ...values };

	if (telemetryAllowed === true) {
		void sendTelemetrySafely(sendUserProperties);
	}
}

export function syncUserProperties(parrot: Parrot | null, wordCount: number) {
	setUserProperties({
		parrot_species: parrot?.species ?? null,
		parrot_age_months: parrot ? ageMonths(parrot.birthdate) : null,
		total_words_registered: wordCount,
		locale: useDeviceSettingsStore.getState().locale,
	});
}

export function track<K extends keyof AnalyticsEvents>(name: K, eventParams: AnalyticsEvents[K]) {
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
}

export function trackScreen(name: string, screenClass = name) {
	currentScreen = name;

	track('screen_view', { screen_name: name, screen_class: screenClass });
}

export function reportError(error: unknown, scope: string, fatal?: boolean) {
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
}
