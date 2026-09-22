import {
	getAnalytics,
	logEvent,
	setAnalyticsCollectionEnabled,
	setUserId,
	setUserProperties as firebaseProperties,
} from "@react-native-firebase/analytics"
import {
	getCrashlytics,
	recordError,
	setAttributes,
	setCrashlyticsCollectionEnabled,
	setUserId as crashUser,
} from "@react-native-firebase/crashlytics"
import {
	getTrackingPermissionsAsync,
	requestTrackingPermissionsAsync,
} from "expo-tracking-transparency"
import { Platform } from "react-native"
import * as Clarity from "react-native-clarity"

import { config } from "@/config"
import { ageMonths } from "@/services/profile/statistics"
import { readData } from "@/services/storage/data-store"
import { firebaseParameters, sendTelemetrySafely } from "@/services/telemetry/events"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import type { AnalyticsConsent } from "@/types/consent"
import type { Events, UserProperties } from "@/types/telemetry"

type Properties = Record<string, string | null>

const DAY_MS = 86_400_000
const CLARITY_TEXT_LIMIT = 255

const clarityEnabled = config.clarityProjectId.trim() !== ""

let allowed: boolean | null = null
let initialization: Promise<AnalyticsConsent> | undefined
let clarityStarted = false
let replayPaused = false

let properties: Properties = {}
let userId: string | null = null
let currentScreen: string | null = null

function storedProperties(): Properties {
	const data = readData()
	const profile = data.profile

	return Object.fromEntries(
		Object.entries({
			profile_age_days: profile
				? Math.max(0, Math.floor((Date.now() - Date.parse(profile.createdAt)) / DAY_MS))
				: null,
			parrot_name: profile?.name ?? null,
			parrot_species: profile?.species ?? null,
			parrot_age_months: profile ? ageMonths(profile.birthDate) : null,
			total_words_registered: Object.values(data.words).filter(
				(word) => !word.archived && word.sourceType === "recording",
			).length,
			total_training_sessions: Object.keys(data.history).length,
			locale: useDeviceSettingsStore.getState().locale,
		}).map(([key, value]) => [key, value === null ? null : String(value)]),
	)
}

async function clarityTag(key: string, value: string) {
	const text = value.slice(0, CLARITY_TEXT_LIMIT).trim()

	if (text) {
		await Clarity.setCustomTag(key.slice(0, CLARITY_TEXT_LIMIT), text)
	}
}

async function applyProperties() {
	await firebaseProperties(getAnalytics(), properties)

	await setAttributes(
		getCrashlytics(),
		Object.fromEntries(
			Object.entries(properties).filter(
				(entry): entry is [string, string] => entry[1] !== null,
			),
		),
	)

	if (clarityStarted) {
		for (const [key, value] of Object.entries(properties)) {
			if (value !== null) {
				await clarityTag(key, value)
			}
		}
	}
}

async function applyUserId() {
	await setUserId(getAnalytics(), userId)

	await crashUser(getCrashlytics(), userId ?? "")

	if (clarityStarted && userId !== null) {
		await Clarity.setCustomUserId(userId)
	}
}

async function applyReplay() {
	if (!clarityStarted) {
		return
	}

	await (allowed === true && !replayPaused ? Clarity.resume() : Clarity.pause())
}

function startClarity() {
	if (!clarityEnabled || clarityStarted) {
		return
	}

	Clarity.setOnSessionStartedCallback(() => {
		void sendTelemetrySafely(async () => {
			await applyProperties()
			await applyUserId()
			await applyReplay()
		})
	})

	Clarity.initialize(config.clarityProjectId)
	clarityStarted = true
}

async function requestConsent(requestATT: boolean): Promise<AnalyticsConsent> {
	if (Platform.OS !== "ios") {
		return "not_applicable"
	}

	let permission = await getTrackingPermissionsAsync()

	if (requestATT && permission.status === "undetermined") {
		permission = await requestTrackingPermissionsAsync()
	}

	return permission.status === "granted" ? "granted" : "denied"
}

export function initializeTelemetry(requestATT = true): Promise<AnalyticsConsent> {
	initialization ??= (async () => {
		const consent = await requestConsent(requestATT)

		useDeviceSettingsStore.getState().setAnalyticsConsent(consent)

		allowed = consent === "granted" || consent === "not_applicable"

		await setAnalyticsCollectionEnabled(getAnalytics(), allowed)
		await setCrashlyticsCollectionEnabled(getCrashlytics(), allowed)

		if (allowed) {
			startClarity()

			await sendTelemetrySafely(applyProperties)
			await sendTelemetrySafely(applyUserId)
		}

		await sendTelemetrySafely(applyReplay)

		return consent
	})().finally(() => {
		initialization = undefined
	})

	return initialization
}

export function setTelemetryIdentity(next: string | null) {
	userId = next

	if (allowed === true) {
		void sendTelemetrySafely(applyUserId)
	}
}

export function setUserProperties(next: UserProperties) {
	const values = Object.fromEntries(
		Object.entries(next).map(([key, value]) => [key, value == null ? null : String(value)]),
	)

	if (Object.entries(values).every(([key, value]) => properties[key] === value)) {
		return
	}

	properties = { ...properties, ...values }

	if (allowed === true) {
		void sendTelemetrySafely(applyProperties)
	}
}

export function syncUserProperties() {
	try {
		setUserProperties(storedProperties())
	} catch (error) {
		reportError(error, "telemetry_properties")
	}
}

export function track<K extends keyof Events>(name: K, payload: Events[K]) {
	if (allowed !== true) {
		return
	}

	void sendTelemetrySafely(async () => {
		await logEvent(getAnalytics(), name.slice(0, 40), firebaseParameters(payload))

		if (!clarityStarted) {
			return
		}

		if (name === "screen_view") {
			await Clarity.setCurrentScreenName((payload as Events["screen_view"]).screen_name)
		}

		for (const [key, value] of Object.entries(payload)) {
			if (value !== null && value !== undefined) {
				await clarityTag(
					`${name}.${key}`,
					Array.isArray(value) ? value.join(",") : String(value),
				)
			}
		}

		await Clarity.sendCustomEvent(name)
	})
}

export function screen(
	name:
		| "onboarding_welcome"
		| "onboarding_profile"
		| "session_setup"
		| "words"
		| "profile"
		| "session_active",
	screenClass = name,
) {
	currentScreen = name

	track("screen_view", { screen_name: name, screen_class: screenClass })
}

export function setSessionReplayPaused(paused: boolean) {
	replayPaused = paused

	void sendTelemetrySafely(applyReplay)
}

export function reportError(error: unknown, scope: string, fatal?: boolean) {
	const value = error instanceof Error ? error : new Error("UnknownError")
	const context = {
		scope,
		...(currentScreen ? { screen_name: currentScreen } : {}),
		...(fatal === undefined ? {} : { is_fatal: String(fatal) }),
	}

	if (allowed !== false) {
		void sendTelemetrySafely(() =>
			setAttributes(getCrashlytics(), context).then(() =>
				recordError(getCrashlytics(), value),
			),
		)
	}

	track("app_error", { error_code: value.name, screen_name: currentScreen })
}
