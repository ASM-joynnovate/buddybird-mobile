import {
	setUserProperties as firebaseProperties,
	getAnalytics,
	logEvent,
	setAnalyticsCollectionEnabled,
	setUserId,
} from "@react-native-firebase/analytics"

import {
	setUserId as crashUser,
	getCrashlytics,
	recordError,
	setAttributes,
	setCrashlyticsCollectionEnabled,
} from "@react-native-firebase/crashlytics"

import {
	getTrackingPermissionsAsync,
	requestTrackingPermissionsAsync,
} from "expo-tracking-transparency"

import { Platform } from "react-native"

import * as Clarity from "react-native-clarity"

import { config } from "@/config"
import { updateData } from "@/services/storage/data-store"
import { firebaseParameters, sendTelemetrySafely } from "@/services/telemetry/events"
import type { AnalyticsConsent } from "@/types/consent"
import { type Events, type UserProperties } from "@/types/telemetry"

let permitted = false

let replayPaused = false

let clarityStarted = false

let identity: string | null = null

let currentScreen: string | null = null

let currentScreenClass: string | null = null

let screenPending = false

let initialization: Promise<AnalyticsConsent> | undefined

function publishScreen() {
	const name = currentScreen

	if (!permitted || !name) {
		return
	}

	track("screen_view", { screen_name: name, screen_class: currentScreenClass ?? name })
	screenPending = false

	if (clarityStarted) {
		void sendTelemetrySafely(() => Clarity.setCurrentScreenName(name))
	}
}

function syncReplay() {
	if (clarityStarted) {
		void sendTelemetrySafely(() =>
			!permitted || replayPaused ? Clarity.pause() : Clarity.resume(),
		)
	}
}

/** OS permission is authoritative; a saved grant never enables collection by itself. */
export function initializeTelemetry(requestATT = true): Promise<AnalyticsConsent> {
	initialization ??= initialize(requestATT).finally(() => {
		initialization = undefined
	})

	return initialization
}

async function initialize(requestATT: boolean): Promise<AnalyticsConsent> {
	permitted = false
	await Promise.all([
		setAnalyticsCollectionEnabled(getAnalytics(), false),
		setCrashlyticsCollectionEnabled(getCrashlytics(), false),
	])
	syncReplay()
	let consent: AnalyticsConsent = "not_applicable"

	if (Platform.OS === "ios") {
		let permission = await getTrackingPermissionsAsync()

		if (requestATT && permission.status === "undetermined") {
			permission = await requestTrackingPermissionsAsync()
		}

		consent = permission.status === "granted" ? "granted" : "denied"
	}

	updateData((data) => {
		data.settings.analyticsConsent = consent
	})
	permitted = consent === "granted" || consent === "not_applicable"
	await Promise.all([
		setAnalyticsCollectionEnabled(getAnalytics(), permitted),
		setCrashlyticsCollectionEnabled(getCrashlytics(), permitted),
	])

	if (permitted && !clarityStarted && config.clarityProjectId.trim()) {
		Clarity.setOnSessionStartedCallback(() => {
			syncReplay()

			const uid = identity

			if (permitted && uid) {
				void sendTelemetrySafely(() => Clarity.setCustomUserId(uid))
			}

			const name = currentScreen

			if (permitted && name) {
				void sendTelemetrySafely(() => Clarity.setCurrentScreenName(name))
			}
		})
		clarityStarted = true
		Clarity.initialize(config.clarityProjectId)
	}

	syncReplay()

	if (identity) {
		setTelemetryIdentity(identity)
	}

	if (screenPending) {
		publishScreen()
	}

	return consent
}

export function setTelemetryIdentity(uid: string) {
	identity = uid

	if (!permitted) {
		return
	}

	void sendTelemetrySafely(() => setUserId(getAnalytics(), uid))
	void sendTelemetrySafely(() => crashUser(getCrashlytics(), uid))

	if (clarityStarted) {
		void sendTelemetrySafely(() => Clarity.setCustomUserId(uid))
	}
}

export function setSessionReplayPaused(paused: boolean) {
	replayPaused = paused
	syncReplay()
}

export function track<K extends keyof Events>(name: K, payload: Events[K]) {
	if (!permitted) {
		return
	}

	void sendTelemetrySafely(() =>
		logEvent(getAnalytics(), name.slice(0, 40), firebaseParameters(payload)),
	)

	if (!clarityStarted) {
		return
	}

	void sendTelemetrySafely(() => Clarity.sendCustomEvent(name))

	for (const [key, value] of Object.entries(payload)) {
		if (value == null || (typeof value === "number" && !Number.isFinite(value))) {
			continue
		}

		void sendTelemetrySafely(() =>
			Clarity.setCustomTag(
				`${name}.${key}`,
				Array.isArray(value) ? value.join(",") : String(value),
			),
		)
	}
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
	currentScreenClass = screenClass
	screenPending = true
	publishScreen()
}

export function setUserProperties(properties: UserProperties) {
	if (!permitted) {
		return
	}

	const strings = Object.fromEntries(
		Object.entries(properties).map(([key, value]) => [
			key,
			value == null ? null : String(value),
		]),
	)

	void sendTelemetrySafely(() => firebaseProperties(getAnalytics(), strings))
	const attributes = Object.fromEntries(
		Object.entries(strings).filter((entry): entry is [string, string] => entry[1] !== null),
	)

	void sendTelemetrySafely(() => setAttributes(getCrashlytics(), attributes))

	if (clarityStarted) {
		for (const [key, value] of Object.entries(attributes)) {
			void sendTelemetrySafely(() => Clarity.setCustomTag(key, value))
		}
	}
}

export function reportError(error: unknown, scope: string, fatal?: boolean) {
	if (!permitted) {
		return
	}

	const value = error instanceof Error ? error : new Error("UnknownError")
	const context: Record<string, string> = { scope }

	if (currentScreen) {
		context.screen_name = currentScreen
	}

	if (fatal !== undefined) {
		context.is_fatal = String(fatal)
	}

	void sendTelemetrySafely(() =>
		setAttributes(getCrashlytics(), context).then(() => recordError(getCrashlytics(), value)),
	)
	track("app_error", {
		error_code: error instanceof Error ? error.name : "UnknownError",
		screen_name: currentScreen,
	})
}
