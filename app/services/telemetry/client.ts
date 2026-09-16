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
import { randomUUID } from "expo-crypto"
import {
	getTrackingPermissionsAsync,
	requestTrackingPermissionsAsync,
} from "expo-tracking-transparency"
import { Platform } from "react-native"
import * as Clarity from "react-native-clarity"

import { currentIdentity } from "@/apis/identity"
import { config } from "@/config"
import { ageMonths } from "@/services/profile/statistics"
import { readData } from "@/services/storage/data-store"
import { readDeviceSetting, saveDeviceSetting } from "@/services/storage/device-settings"
import { firebaseParameters, sendTelemetrySafely } from "@/services/telemetry/events"
import {
	clearOutbox,
	readOutbox,
	removeEvent,
	saveEvent,
	type Destination,
	type PendingEvent,
	type Properties,
} from "@/services/telemetry/outbox"
import type { AnalyticsConsent } from "@/types/consent"
import type { Events, TelemetryEvent, UserProperties } from "@/types/telemetry"

// One module owns SDK calls for the entire JS runtime, including React remounts.
let allowed: boolean | null = null
let started = false
let initialization: Promise<AnalyticsConsent> | undefined
let initialProperties: Properties | null = null
let properties: Properties = {}
let currentScreen: string | null = null
let clarityScreen: string | null = null
let replayPaused = false
let replayTask = Promise.resolve()
let clarityStarted = false
let disabling = Promise.resolve()
let entries = new Map<string, PendingEvent>()
let restored = false
let discarding = false
let sequence = 0
let flushing = false
let requested = false
let retryTimer: ReturnType<typeof setTimeout> | undefined
let retryDelay = 1000
const destinations: Destination[] = config.clarityProjectId.trim()
	? ["firebase", "clarity"]
	: ["firebase"]
const state = {
	firebase: { enabled: false, properties: "", uid: undefined as string | null | undefined },
	clarity: { enabled: false, properties: "", uid: undefined as string | null | undefined },
}

function defer(error: unknown) {
	console.warn("[analytics] Delivery deferred; pending events retained", error)

	if (!started || retryTimer !== undefined) {
		return
	}

	retryTimer = setTimeout(() => {
		retryTimer = undefined

		if (allowed === null) {
			void initializeTelemetry(false).catch(() => {})
		} else {
			kick()
		}
	}, retryDelay)
	retryDelay = Math.min(60_000, retryDelay * 2)
}

// ponytail: restore pending metadata once; page it if large backlogs delay startup.
function restore() {
	if (discarding) {
		clearOutbox()
		discarding = false
		restored = true
	}

	if (restored) {
		return
	}

	const saved = readOutbox()

	for (const entry of saved) {
		if (!entry.ready) {
			// A reservation without native start confirmation cannot be replayed.
			console.warn("[analytics] Discarding an unconfirmed session start")
			removeEvent(entry.id)
		}
	}

	sequence = saved.reduce((maximum, entry) => Math.max(maximum, entry.order), 0)

	for (const entry of entries.values()) {
		entry.order = ++sequence
	}

	entries = new Map([
		...saved.filter((entry) => entry.ready).map((entry) => [entry.id, entry] as const),
		...entries,
	])
	restored = true
}

function storedProperties(): Properties {
	const data = readData()
	const profile = data.profile

	return Object.fromEntries(
		Object.entries({
			profile_age_days: profile
				? Math.max(0, Math.floor((Date.now() - Date.parse(profile.createdAt)) / 86_400_000))
				: null,
			parrot_name: profile?.name ?? null,
			parrot_species: profile?.species ?? null,
			parrot_age_months: profile ? ageMonths(profile.birthDate) : null,
			total_words_registered: Object.values(data.words).filter(
				(word) => !word.archived && word.sourceType === "recording",
			).length,
			total_training_sessions: Object.keys(data.history).length,
			locale: readDeviceSetting("locale"),
		}).map(([key, value]) => [key, value === null ? null : String(value)]),
	)
}

function seedProperties() {
	if (initialProperties === null) {
		initialProperties = storedProperties()
		properties = { ...initialProperties, ...properties }
	}
}

function kick() {
	requested = true
	void Promise.resolve().then(flush)
}

function append(event: TelemetryEvent | null, ready = true) {
	if (allowed === false) {
		return undefined
	}

	for (const prepare of [restore, seedProperties]) {
		try {
			prepare()
		} catch (error) {
			defer(error)
		}
	}

	let uid: string | null | undefined

	try {
		uid =
			currentIdentity() ??
			(destinations.every((destination) => state[destination].enabled) ? null : undefined)
	} catch (error) {
		defer(error)
	}

	const entry: PendingEvent = {
		id: randomUUID(),
		order: ++sequence,
		time: Date.now(),
		properties: initialProperties ? { ...properties } : null,
		uid,
		event: event ? (JSON.parse(JSON.stringify(event)) as TelemetryEvent) : null,
		ready,
		delivered: [],
	}

	entries.set(entry.id, entry)

	try {
		if (restored) {
			saveEvent(entry)
		}
	} catch (error) {
		defer(error)
	}

	kick()

	return entry
}

function syncReplay() {
	replayTask = replayTask
		.catch(() => {})
		.then(async () => {
			if (clarityStarted) {
				await (allowed === true && state.clarity.enabled && !replayPaused
					? Clarity.resume()
					: Clarity.pause())
			}
		})

	return replayTask
}

async function acceptedByClarity(result: Promise<boolean>) {
	if (!(await result)) {
		throw new Error("Clarity did not accept analytics data")
	}
}

async function clarityTag(key: string, value: string) {
	const text = value.slice(0, 255).trim()

	if (text) {
		await acceptedByClarity(Clarity.setCustomTag(key.slice(0, 255), text))
	}
}

async function setClarityScreen(name: string) {
	if (clarityScreen !== name) {
		await acceptedByClarity(Clarity.setCurrentScreenName(name))
		clarityScreen = name
	}
}

async function applyContext(destination: Destination, values: Properties, uid: string | null) {
	const target = state[destination]
	const serialized = JSON.stringify(values)

	if (target.properties !== serialized) {
		try {
			if (destination === "firebase") {
				await firebaseProperties(getAnalytics(), values)
				await setAttributes(
					getCrashlytics(),
					Object.fromEntries(
						Object.entries(values).filter(
							(entry): entry is [string, string] => entry[1] !== null,
						),
					),
				)
			} else {
				for (const [key, value] of Object.entries(values)) {
					if (value !== null) {
						await clarityTag(key, value)
					}
				}
			}

			target.properties = serialized
		} catch (error) {
			target.properties = ""
			throw error
		}
	}

	if (target.uid !== uid) {
		try {
			if (destination === "firebase") {
				await setUserId(getAnalytics(), uid)
				await crashUser(getCrashlytics(), uid ?? "")
			} else if (uid !== null) {
				await acceptedByClarity(Clarity.setCustomUserId(uid))
			}

			target.uid = uid
		} catch (error) {
			target.uid = undefined
			throw error
		}
	}
}

function disableCollection(crashes = false) {
	state.firebase.enabled = false
	disabling = Promise.allSettled([
		disabling.catch(() => {}),
		setAnalyticsCollectionEnabled(getAnalytics(), false),
		...(crashes ? [setCrashlyticsCollectionEnabled(getCrashlytics(), false)] : []),
	]).then((results) => {
		const failure = results.find((result) => result.status === "rejected")

		if (failure?.status === "rejected") {
			throw failure.reason
		}
	})

	return disabling
}

async function deliver(destination: Destination) {
	const target = state[destination]

	try {
		if (destination === "firebase") {
			await disabling.catch(() => disableCollection())
		}

		if (destination === "clarity" && !clarityStarted) {
			Clarity.setOnSessionStartedCallback(() => {
				state.clarity.properties = ""
				clarityScreen = null
				state.clarity.uid = undefined
				void sendTelemetrySafely(syncReplay)
				kick()
			})
			Clarity.initialize(config.clarityProjectId)
			clarityStarted = true
			await syncReplay()
		}

		await applyContext(destination, properties, currentIdentity())

		if (allowed !== true) {
			return
		}

		if (!target.enabled) {
			if (destination === "firebase") {
				await disabling.catch(() => disableCollection())

				if (allowed !== true) {
					return
				}

				await setAnalyticsCollectionEnabled(getAnalytics(), true)
				await setCrashlyticsCollectionEnabled(getCrashlytics(), true)
			}

			target.enabled = true

			if (destination === "clarity") {
				await syncReplay()
			}
		}

		for (const entry of entries.values()) {
			if (allowed !== true || !entry.ready) {
				break
			}

			if (!entries.has(entry.id) || entry.delivered.includes(destination)) {
				continue
			}

			entry.properties ??= { ...initialProperties }

			if (entry.uid === undefined) {
				entry.uid = currentIdentity()
			}

			saveEvent(entry)
			await applyContext(destination, entry.properties, entry.uid)

			if (allowed !== true || !entries.has(entry.id)) {
				break
			}

			if (entry.event) {
				const { name, params } = entry.event
				const metadata = { client_event_id: entry.id, client_event_time_ms: entry.time }

				if (destination === "firebase") {
					await logEvent(
						getAnalytics(),
						name.slice(0, 40),
						firebaseParameters({ ...params, ...metadata }),
					)
				} else {
					if (name === "screen_view") {
						await setClarityScreen(params.screen_name)
					}

					for (const [key, value] of Object.entries({ ...params, ...metadata })) {
						if (value !== null && value !== undefined) {
							await clarityTag(
								name + "." + key,
								Array.isArray(value) ? value.join(",") : String(value),
							)
						}
					}

					await acceptedByClarity(Clarity.sendCustomEvent(name))
				}
			}

			if (!entries.has(entry.id)) {
				break
			}

			entry.delivered.push(destination)
			saveEvent(entry)
		}
	} finally {
		// Replaying an old event must not leave the SDK on that event's old identity.
		if (allowed === true && (destination === "firebase" || clarityStarted)) {
			await applyContext(destination, properties, currentIdentity())

			if (destination === "clarity" && currentScreen) {
				await setClarityScreen(currentScreen)
			}
		} else if (destination === "firebase") {
			await setAnalyticsCollectionEnabled(getAnalytics(), false)
			state.firebase.enabled = false
		}
	}
}

function discardPending() {
	entries.clear()
	restored = false
	discarding = true
	restore()
}

async function flush() {
	if (!started || flushing || retryTimer !== undefined) {
		return
	}

	flushing = true
	requested = false

	try {
		if (allowed !== true) {
			if (allowed === false) {
				discardPending()
			}

			await setAnalyticsCollectionEnabled(getAnalytics(), false)
			state.firebase.enabled = false
			state.clarity.enabled = false
			await syncReplay()

			if (allowed === false) {
				await setCrashlyticsCollectionEnabled(getCrashlytics(), false)
			}

			return
		}

		restore()
		seedProperties()

		// Persist each record independently; a backlog never rewrites one growing JSON document.
		for (const entry of entries.values()) {
			saveEvent(entry)
		}

		const results = await Promise.allSettled(destinations.map(deliver))

		for (const entry of entries.values()) {
			if (
				entry.ready &&
				destinations.every((destination) => entry.delivered.includes(destination))
			) {
				removeEvent(entry.id)
				entries.delete(entry.id)
			}
		}

		const failure = results.find((result) => result.status === "rejected")

		if (failure?.status === "rejected") {
			throw failure.reason
		}

		retryDelay = 1000
	} catch (error) {
		defer(error)
	} finally {
		flushing = false

		if (requested && retryTimer === undefined) {
			kick()
		}
	}
}

/** Permission lookup and event delivery never hold up product UI. */
export function initializeTelemetry(requestATT = true): Promise<AnalyticsConsent> {
	started = true
	clearTimeout(retryTimer)
	retryTimer = undefined

	if (!initialization) {
		allowed = null
		state.clarity.enabled = false
		// Permission changes must disable collection even if an event SDK call is still pending.
		void disableCollection().catch(defer)
		void sendTelemetrySafely(syncReplay)
		kick()
		initialization = (async () => {
			let consent: AnalyticsConsent = "not_applicable"

			if (Platform.OS === "ios") {
				let permission = await getTrackingPermissionsAsync()

				if (requestATT && permission.status === "undetermined") {
					permission = await requestTrackingPermissionsAsync()
				}

				consent = permission.status === "granted" ? "granted" : "denied"
			}

			saveDeviceSetting("analyticsConsent", consent)
			allowed = consent === "granted" || consent === "not_applicable"

			if (!allowed) {
				void disableCollection(true).catch(defer)

				try {
					discardPending()
				} catch (error) {
					defer(error)
				}
			}

			return consent
		})()
			.catch((error) => {
				defer(error)
				throw error
			})
			.finally(() => {
				initialization = undefined
				kick()
			})
	}

	return initialization
}

export function setTelemetryIdentity(_uid: string) {
	// Read the SDK's current identity, so a delayed subscriber cannot restore an older UID.
	kick()
}

export function syncUserProperties() {
	try {
		setUserProperties(storedProperties())
	} catch (error) {
		defer(error)
	}
}

export function setUserProperties(next: UserProperties) {
	try {
		seedProperties()
	} catch (error) {
		defer(error)
	}

	const values = Object.fromEntries(
		Object.entries(next).map(([key, value]) => [key, value == null ? null : String(value)]),
	)

	if (Object.entries(values).every(([key, value]) => properties[key] === value)) {
		return
	}

	properties = { ...properties, ...values }
	append(null)
}

export function track<K extends keyof Events>(name: K, payload: Events[K]) {
	append({ name, params: payload } as TelemetryEvent)
}

/** Payloads are already available from MMKV; only native start confirmation is deferred. */
export function reserveEvents(events: TelemetryEvent[]) {
	const reserved = events
		.map((event) => append(event, false))
		.filter((entry): entry is PendingEvent => Boolean(entry))
	let settled = false

	return (confirmed: boolean) => {
		if (settled) {
			return
		}

		settled = true

		for (const entry of reserved) {
			if (!entries.has(entry.id)) {
				continue
			}

			try {
				if (confirmed) {
					entry.ready = true

					if (restored) {
						saveEvent(entry)
					}
				} else {
					entry.event = null
					entry.ready = true
					entry.delivered = [...destinations]
					removeEvent(entry.id)
					entries.delete(entry.id)
				}
			} catch (error) {
				defer(error)
			}
		}

		kick()
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
	track("screen_view", { screen_name: name, screen_class: screenClass })
}

export function setSessionReplayPaused(paused: boolean) {
	replayPaused = paused
	void sendTelemetrySafely(syncReplay)
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
