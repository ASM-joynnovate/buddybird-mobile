import { randomUUID } from "expo-crypto"

import {
	DAY,
	event,
	HOUR,
	iso,
	learningMsBetween,
	type MockConsent,
	type MockSession,
	type MockSettings,
	plays,
	seed,
} from "@/apis/mock/seed"
import { ApiError } from "@/lib/api"
import { currentSpan } from "@/services/session/phases"

const LATENCY_MS = 450
const APPLY_DELAY_MS = 3000
const PROCESSING_DELAY_MS = 2500
const PAGE_SIZE = 20
const MAX_RECORDINGS = 5
const TAKEN_NICKNAMES = ["버디", "buddy"]

const db = seed(Date.now())

function respond<T>(produce: () => T): Promise<T> {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			let value: T

			try {
				value = produce()
			} catch (error) {
				reject(error)

				return
			}

			resolve(value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T))
		}, LATENCY_MS)
	})
}

function notFound() {
	return new ApiError(404, "COMMON__RESOURCE_NOT_FOUND", "Resource not found")
}

function find<T extends { id: string }>(items: T[], id: string): T {
	const found = items.find((item) => item.id === id)

	if (!found) {
		throw notFound()
	}

	return found
}

function localizeConsent(consent: MockConsent, locale: "ko" | "en") {
	const { title_en, body_en, ...rest } = consent

	return locale === "en" ? { ...rest, title: title_en, body: body_en } : rest
}

function currentDevice() {
	return db.devices.find((device) => device.is_current) ?? db.devices[0]
}

function runningRecord() {
	return db.sessions.find((session) => session.status === "running") ?? null
}

function replaceSession(id: string, change: (session: MockSession) => MockSession) {
	db.sessions = db.sessions.map((session) => (session.id === id ? change(session) : session))
}

function runningView(session: MockSession) {
	const now = Date.now()
	const station = find(db.devices, session.station_device_id)
	const span = currentSpan(Date.parse(session.started_at), now, {
		sleepAt: session.sleep_at,
		wakeAt: session.wake_at,
	})

	return {
		id: session.id,
		station_device: {
			id: station.id,
			name: station.name,
			model: station.model,
			is_current: station.is_current,
		},
		word: session.word,
		learning_enabled: session.learning_enabled,
		settings_version: session.settings_version,
		applied_settings_version: session.applied_settings_version,
		current_phase: span.phase,
		phase_started_at: iso(span.start),
		started_at: session.started_at,
		last_heartbeat_at: station.is_current ? session.last_heartbeat_at : iso(now - 4000),
		battery_level: session.battery_level,
		is_charging: session.is_charging,
		camera_available: session.camera_available,
		sleep_at: session.sleep_at,
		wake_at: session.wake_at,
	}
}

function summaryView(session: MockSession) {
	const now = Date.now()
	const end = session.ended_at ? Date.parse(session.ended_at) : now
	const learned = learningMsBetween(session, Date.parse(session.started_at), end, now)

	return {
		id: session.id,
		status: session.status,
		started_at: session.started_at,
		ended_at: session.ended_at,
		ended_by: session.ended_by,
		word: session.word,
		learning_enabled: session.learning_enabled,
		...plays(learned),
		sound_count: session.sounds.length,
		mimicry_count: session.sounds.filter((sound) => sound.judgment).length,
		emergency_count: db.emergencies.filter((item) => item.session_id === session.id).length,
		sleep_at: session.sleep_at,
		wake_at: session.wake_at,
	}
}

function finish(id: string, endedBy: "user" | "server") {
	const now = Date.now()

	replaceSession(id, (session) => ({
		...session,
		status: "finished",
		ended_at: iso(now),
		ended_by: endedBy,
		events: [...session.events, event("session_finished", now)],
	}))
}

function requireRunning(id: string) {
	const session = find(db.sessions, id)

	if (session.status !== "running") {
		throw new ApiError(409, "SESSION__NOT_RUNNING", "Session is not running")
	}

	return session
}

function wordRef(wordId: string) {
	const word = find(db.words, wordId)

	return { id: word.id, name: word.name }
}

function allSounds() {
	return db.sessions.flatMap((session) => session.sounds)
}

function dayStart(at: number) {
	const date = new Date(at)

	date.setHours(0, 0, 0, 0)

	return date.getTime()
}

function previousDay(day: number) {
	const date = new Date(day)

	date.setDate(date.getDate() - 1)

	return date.getTime()
}

function streakDays(now: number) {
	const days = new Set<number>()

	for (const session of db.sessions) {
		const end = session.ended_at ? Date.parse(session.ended_at) : now

		for (let day = dayStart(Date.parse(session.started_at)); day <= end; day += DAY) {
			days.add(dayStart(day))
		}
	}

	let cursor = days.has(dayStart(now)) ? dayStart(now) : previousDay(dayStart(now))
	let count = 0

	while (days.has(cursor)) {
		count++
		cursor = previousDay(cursor)
	}

	return count
}

function parseLocalDate(value: string) {
	const [year, month, day] = value.split("-").map(Number)

	return new Date(year, month - 1, day).getTime()
}

function formatLocalDate(at: number) {
	const date = new Date(at)

	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function reportRange(period: "day" | "week" | "month", start: string) {
	const from = parseLocalDate(start)
	const date = new Date(from)

	if (period === "day") {
		date.setDate(date.getDate() + 1)
	} else if (period === "week") {
		date.setDate(date.getDate() + 7)
	} else {
		date.setMonth(date.getMonth() + 1)
	}

	return { from, to: date.getTime() }
}

function buckets(period: "day" | "week" | "month", from: number, to: number) {
	const starts: number[] = []
	const date = new Date(from)

	while (date.getTime() < to) {
		starts.push(date.getTime())

		if (period === "day") {
			date.setHours(date.getHours() + 1)
		} else {
			date.setDate(date.getDate() + 1)
		}
	}

	return starts.map((start, index) => ({ start, end: starts[index + 1] ?? to }))
}

function overlaps(session: MockSession, from: number, to: number) {
	const end = session.ended_at ? Date.parse(session.ended_at) : Date.now()

	return Date.parse(session.started_at) < to && end >= from
}

export const mockServer = {
	users: {
		me: () => respond(() => db.user),
		update: (input: { nickname?: string; photo_url?: string | null }) =>
			respond(() => {
				if (
					input.nickname &&
					TAKEN_NICKNAMES.includes(input.nickname.trim().toLowerCase())
				) {
					throw new ApiError(409, "USER__DUPLICATE_NICKNAME", "Nickname already in use")
				}

				db.user = {
					...db.user,
					...(input.nickname === undefined ? {} : { nickname: input.nickname.trim() }),
					...(input.photo_url === undefined ? {} : { photo_url: input.photo_url }),
				}

				return db.user
			}),
	},
	settings: {
		get: () => respond(() => db.settings),
		update: (patch: Partial<MockSettings>) =>
			respond(() => {
				db.settings = { ...db.settings, ...patch }

				const running = runningRecord()

				if (running) {
					replaceSession(running.id, (session) => ({
						...session,
						sleep_at: db.settings.sleep_at,
						wake_at: db.settings.wake_at,
					}))
				}

				return db.settings
			}),
	},
	consents: {
		list: (locale: "ko" | "en") =>
			respond(() => db.consents.map((consent) => localizeConsent(consent, locale))),
		save: (decisions: { consent_id: string; status: "granted" | "denied" }[]) =>
			respond(() => {
				db.consents = db.consents.map((consent) => {
					const decision = decisions.find((item) => item.consent_id === consent.id)

					return decision ? { ...consent, status: decision.status } : consent
				})
			}),
	},
	parrots: {
		list: () => respond(() => db.parrots),
		create: (input: {
			name: string
			species: string
			birthdate: string | null
			photo_url: string | null
		}) =>
			respond(() => {
				const parrot = { id: randomUUID(), ...input }

				db.parrots = [...db.parrots, parrot]

				return parrot
			}),
		update: (
			id: string,
			input: {
				name: string
				species: string
				birthdate: string | null
				photo_url: string | null
			},
		) =>
			respond(() => {
				const parrot = { ...find(db.parrots, id), ...input }

				db.parrots = db.parrots.map((item) => (item.id === id ? parrot : item))

				return parrot
			}),
		remove: (id: string) =>
			respond(() => {
				find(db.parrots, id)
				db.parrots = db.parrots.filter((item) => item.id !== id)
			}),
	},
	words: {
		list: () => respond(() => db.words),
		get: (id: string) => respond(() => find(db.words, id)),
		create: (name: string) =>
			respond(() => {
				const word = { id: randomUUID(), name: name.trim(), recordings: [] }

				db.words = [...db.words, word]

				return word
			}),
		rename: (id: string, name: string) =>
			respond(() => {
				const word = { ...find(db.words, id), name: name.trim() }

				db.words = db.words.map((item) => (item.id === id ? word : item))

				return word
			}),
		remove: (id: string) =>
			respond(() => {
				find(db.words, id)
				db.words = db.words.filter((item) => item.id !== id)
			}),
		addRecording: (id: string, file: { uri: string; duration_ms: number }) =>
			respond(() => {
				if (find(db.words, id).recordings.length >= MAX_RECORDINGS) {
					throw new ApiError(422, "WORD__RECORDING_LIMIT", "Recording limit reached")
				}

				const recording = {
					id: randomUUID(),
					url: file.uri,
					duration_ms: file.duration_ms,
					status: "processing" as const,
					created_at: iso(Date.now()),
				}

				db.words = db.words.map((item) =>
					item.id === id
						? { ...item, recordings: [...item.recordings, recording] }
						: item,
				)
				setTimeout(() => {
					db.words = db.words.map((item) => ({
						...item,
						recordings: item.recordings.map((entry) =>
							entry.id === recording.id
								? { ...entry, status: "ready" as const }
								: entry,
						),
					}))
				}, PROCESSING_DELAY_MS)

				return recording
			}),
		removeRecording: (id: string, recordingId: string) =>
			respond(() => {
				const word = find(db.words, id)

				find(word.recordings, recordingId)

				if (word.recordings.length <= 1) {
					throw new ApiError(422, "WORD__RECORDING_REQUIRED", "At least one recording")
				}

				db.words = db.words.map((item) =>
					item.id === id
						? {
								...item,
								recordings: item.recordings.filter(
									(entry) => entry.id !== recordingId,
								),
							}
						: item,
				)
			}),
	},
	devices: {
		list: () =>
			respond(() => {
				const running = runningRecord()

				return db.devices.map((device) => ({
					...device,
					last_seen_at: device.is_current ? iso(Date.now()) : device.last_seen_at,
					is_running_session: running?.station_device_id === device.id,
				}))
			}),
		rename: (id: string, name: string | null) =>
			respond(() => {
				find(db.devices, id)
				db.devices = db.devices.map((device) =>
					device.id === id ? { ...device, name: name?.trim() || null } : device,
				)
			}),
		disconnect: (id: string) =>
			respond(() => {
				find(db.devices, id)

				const running = runningRecord()

				if (running?.station_device_id === id) {
					finish(running.id, "server")
				}

				db.devices = db.devices.filter((device) => device.id !== id)
			}),
		registerPushToken: (_token: string) => respond(() => undefined),
	},
	sessions: {
		running: () =>
			respond(() => {
				const running = runningRecord()

				return running ? runningView(running) : null
			}),
		start: (input: {
			word_id: string | null
			learning_enabled: boolean
			replace_running: boolean
		}) =>
			respond(() => {
				const running = runningRecord()

				if (running && !input.replace_running) {
					throw new ApiError(
						409,
						"SESSION__ALREADY_RUNNING",
						"Another session is running",
					)
				}

				if (running) {
					finish(running.id, "user")
				}

				const now = Date.now()
				const word = input.learning_enabled && input.word_id ? wordRef(input.word_id) : null
				const session: MockSession = {
					id: randomUUID(),
					status: "running",
					started_at: iso(now),
					ended_at: null,
					ended_by: null,
					word,
					learning_enabled: input.learning_enabled,
					sleep_at: db.settings.sleep_at,
					wake_at: db.settings.wake_at,
					station_device_id: currentDevice().id,
					settings_version: 1,
					applied_settings_version: 1,
					last_heartbeat_at: iso(now),
					battery_level: null,
					is_charging: null,
					camera_available: true,
					events: [
						event("session_started", now),
						...(word ? [event("learning_started", now, { word })] : []),
					],
					sounds: [],
					activity: [],
				}

				db.sessions = [...db.sessions, session]

				return runningView(session)
			}),
		finish: (id: string) =>
			respond(() => {
				requireRunning(id)
				finish(id, "user")

				return summaryView(find(db.sessions, id))
			}),
		updateSettings: (id: string, input: { word_id?: string; learning_enabled?: boolean }) =>
			respond(() => {
				const session = requireRunning(id)
				const now = Date.now()
				const word = input.word_id ? wordRef(input.word_id) : session.word
				const learning = input.learning_enabled ?? session.learning_enabled
				const version = session.settings_version + 1
				const changes = [
					...(input.word_id ? [event("word_changed", now, { word })] : []),
					...(input.learning_enabled === undefined
						? []
						: [event("learning_toggled", now, { learning_enabled: learning })]),
				]

				replaceSession(id, (current) => ({
					...current,
					word,
					learning_enabled: learning,
					settings_version: version,
					events: [...current.events, ...changes],
				}))

				if (!find(db.devices, session.station_device_id).is_current) {
					setTimeout(() => {
						replaceSession(id, (current) => ({
							...current,
							applied_settings_version: Math.max(
								current.applied_settings_version,
								version,
							),
						}))
					}, APPLY_DELAY_MS)
				}

				return runningView(find(db.sessions, id))
			}),
		heartbeat: (
			id: string,
			input: {
				applied_settings_version: number
				battery_level: number | null
				is_charging: boolean | null
				camera_available: boolean
			},
		) =>
			respond(() => {
				requireRunning(id)
				replaceSession(id, (current) => ({
					...current,
					...input,
					last_heartbeat_at: iso(Date.now()),
				}))

				return runningView(find(db.sessions, id))
			}),
		list: (from: number, to: number) =>
			respond(() =>
				db.sessions
					.filter((session) => overlaps(session, from, to))
					.map(summaryView)
					.sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at)),
			),
		detail: (id: string) => respond(() => summaryView(find(db.sessions, id))),
		timeline: (id: string) =>
			respond(() => {
				const session = find(db.sessions, id)

				return {
					events: session.events,
					sounds: session.sounds.filter((sound) => sound.is_parrot_sound !== false),
					activity: session.activity,
				}
			}),
		soundFeedback: (soundId: string, feedback: "up" | "down") =>
			respond(() => {
				find(allSounds(), soundId)
				db.sessions = db.sessions.map((session) => ({
					...session,
					sounds: session.sounds.map((sound) =>
						sound.id === soundId ? { ...sound, feedback } : sound,
					),
				}))
			}),
	},
	emergencies: {
		get: (id: string) =>
			respond(() => {
				const { deleted, ...emergency } = find(db.emergencies, id)

				if (deleted) {
					throw notFound()
				}

				return {
					...emergency,
					session_running: find(db.sessions, emergency.session_id).status === "running",
				}
			}),
		confirm: (id: string) =>
			respond(() => {
				find(db.emergencies, id)
				db.emergencies = db.emergencies.map((item) =>
					item.id === id ? { ...item, is_confirmed: true } : item,
				)
			}),
		remove: (id: string) =>
			respond(() => {
				find(db.emergencies, id)
				db.emergencies = db.emergencies.map((item) =>
					item.id === id ? { ...item, deleted: true } : item,
				)
			}),
	},
	home: {
		summary: () =>
			respond(() => {
				const running = runningRecord()
				const latest = allSounds()
					.filter((sound) => sound.judgment && sound.audio_url)
					.sort((a, b) => Date.parse(b.captured_at) - Date.parse(a.captured_at))[0]
				const alarm = db.emergencies
					.filter((item) => !item.is_confirmed && !item.deleted)
					.sort((a, b) => Date.parse(b.detected_at) - Date.parse(a.detected_at))[0]

				return {
					running_session: running ? runningView(running) : null,
					unread_notification_count: db.notifications.filter((item) => !item.read_at)
						.length,
					streak_days: streakDays(Date.now()),
					latest_mimicry: latest ?? null,
					unconfirmed_emergency: alarm
						? {
								id: alarm.id,
								session_id: alarm.session_id,
								kind: alarm.kind,
								detected_at: alarm.detected_at,
							}
						: null,
					unread_notices: db.notices
						.filter((notice) => !notice.is_read)
						.sort((a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at)),
				}
			}),
	},
	notifications: {
		list: (page: number) =>
			respond(() => {
				const total = Math.max(1, Math.ceil(db.notifications.length / PAGE_SIZE))

				return {
					data: db.notifications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
					meta: {
						current_page: page,
						total_page_count: total,
						is_first: page === 1,
						is_last: page >= total,
					},
				}
			}),
		read: (id: string) =>
			respond(() => {
				find(db.notifications, id)
				db.notifications = db.notifications.map((item) =>
					item.id === id && !item.read_at ? { ...item, read_at: iso(Date.now()) } : item,
				)
			}),
		readAll: () =>
			respond(() => {
				const now = iso(Date.now())

				db.notifications = db.notifications.map((item) =>
					item.read_at ? item : { ...item, read_at: now },
				)
			}),
	},
	notices: {
		list: () =>
			respond(() =>
				[...db.notices].sort((a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at)),
			),
		get: (id: string) => respond(() => find(db.notices, id)),
		read: (id: string) =>
			respond(() => {
				find(db.notices, id)
				db.notices = db.notices.map((notice) =>
					notice.id === id ? { ...notice, is_read: true } : notice,
				)
			}),
	},
	reports: {
		get: (period: "day" | "week" | "month", start: string) =>
			respond(() => {
				const now = Date.now()
				const { from, to } = reportRange(period, start)
				const sessions = db.sessions.filter((session) => overlaps(session, from, to))
				const counts = new Map<
					string,
					{ word: { id: string; name: string }; play_count: number }
				>()
				let totalCount = 0
				let totalDuration = 0

				for (const session of sessions) {
					const played = plays(learningMsBetween(session, from, to, now))

					totalCount += played.play_count
					totalDuration += played.play_duration_ms

					if (session.word && played.play_count > 0) {
						counts.set(session.word.id, {
							word: session.word,
							play_count:
								(counts.get(session.word.id)?.play_count ?? 0) + played.play_count,
						})
					}
				}

				const sounds = sessions
					.flatMap((session) => session.sounds)
					.filter((sound) => {
						const at = Date.parse(sound.captured_at)

						return sound.is_parrot_sound === true && at >= from && at < to
					})
					.sort((a, b) => Date.parse(b.captured_at) - Date.parse(a.captured_at))

				return {
					period,
					start,
					end: formatLocalDate(to - HOUR),
					total_play_count: totalCount,
					total_play_duration_ms: totalDuration,
					mimicry_count: sounds.filter((sound) => sound.judgment).length,
					trend: buckets(period, from, to).map((bucket) => ({
						start: iso(bucket.start),
						play_duration_ms: sessions.reduce(
							(sum, session) =>
								sum +
								plays(learningMsBetween(session, bucket.start, bucket.end, now))
									.play_duration_ms,
							0,
						),
					})),
					words: [...counts.values()].sort((a, b) => b.play_count - a.play_count),
					sounds,
				}
			}),
	},
}
