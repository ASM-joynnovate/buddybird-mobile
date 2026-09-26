import { randomUUID } from "expo-crypto"

import {
	event,
	iso,
	learningMsBetween,
	type MockConsent,
	type MockDevice,
	type MockEvent,
	type MockLocale,
	type MockNotification,
	type MockRecording,
	type MockSession,
	type MockSound,
	type MockWord,
	plays,
	seed,
	sleepEvents,
	sleepWindowOf,
} from "@/mocks/seed"
import { currentSpan } from "@/services/session/phases"
import { ApiError } from "@/types/apis/common"
import { MAX_RECORDINGS } from "@/types/apis/words"
import { HOUR } from "@/utils/units"

const LATENCY_MS = 450
const PROCESSING_DELAY_MS = 2500
const PAGE_SIZE = 20
const UPLOAD_EXPIRES_SECONDS = 300
const TAKEN_NICKNAMES = ["버디", "buddy"]

type SaveUploadedFile = (uri: string, durationMs: number) => void

const db = seed(Date.now())
const pendingUploads = new Map<string, SaveUploadedFile>()

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

function toPage<T>(items: T[], pageNumber: number) {
	const total = Math.max(1, Math.ceil(items.length / PAGE_SIZE))

	return {
		data: items.slice((pageNumber - 1) * PAGE_SIZE, pageNumber * PAGE_SIZE),
		meta: {
			current_page: pageNumber,
			total_page_count: total,
			is_first: pageNumber === 1,
			is_last: pageNumber >= total,
		},
	}
}

function issueUpload(saveUploadedFile: SaveUploadedFile) {
	const fileId = randomUUID()

	pendingUploads.set(fileId, saveUploadedFile)

	return {
		file_id: fileId,
		url: `mock://uploads/${fileId}`,
		headers: {},
		expires_in: UPLOAD_EXPIRES_SECONDS,
	}
}

function deviceDto({ name: _name, ...device }: MockDevice) {
	return device.id === db.currentDeviceId ? { ...device, last_seen_at: iso(Date.now()) } : device
}

function recordingDto({ duration_ms: _duration, status: _status, ...recording }: MockRecording) {
	return recording
}

function wordDto(word: MockWord) {
	return { ...word, recordings: word.recordings.map(recordingDto) }
}

function eventDto(item: MockEvent) {
	return {
		id: item.id,
		kind: item.kind,
		occurred_at: item.occurred_at,
		word: item.word_id ? { id: item.word_id } : null,
	}
}

function soundDto(sound: MockSound) {
	return {
		id: sound.id,
		session_id: sound.session_id,
		captured_at: sound.captured_at,
		audio: { url: sound.audio_url },
		judgment: sound.analyzed ? { word_id: sound.word_id } : null,
	}
}

function notificationDto({ session_id: _session, ...item }: MockNotification) {
	return item
}

function runningRecord() {
	return db.sessions.find((session) => session.status === "running") ?? null
}

function replaceSession(id: string, change: (session: MockSession) => MockSession) {
	db.sessions = db.sessions.map((session) => (session.id === id ? change(session) : session))
}

function isStationOnOtherDevice(session: MockSession) {
	return session.station_device_id !== db.currentDeviceId
}

function sessionDto(session: MockSession) {
	const now = Date.now()
	const running = session.status === "running"
	const span = running
		? currentSpan(Date.parse(session.started_at), now, sleepWindowOf(db.settings))
		: null

	return {
		id: session.id,
		status: session.status,
		station: { device_id: session.station_device_id },
		settings: {
			word_id: session.word_id,
			learning_enabled: session.learning_enabled,
			version: session.settings_version,
			applied_version: session.applied_settings_version,
		},
		progress: {
			current_phase: span?.phase ?? null,
			phase_started_at: span ? iso(span.start) : null,
			last_heartbeat_at:
				running && isStationOnOtherDevice(session)
					? iso(now - 4000)
					: session.last_heartbeat_at,
		},
		period: {
			started_at: session.started_at,
			ended_at: session.ended_at,
			ended_by: session.ended_by,
		},
	}
}

function finish(id: string, endedBy: "user" | "server") {
	const now = Date.now()

	replaceSession(id, (session) => {
		const ended = { ...session, ended_at: iso(now) }

		return {
			...ended,
			status: "finished",
			ended_by: endedBy,
			events: [...session.events, event("session_finished", now)],
			sleep_events: sleepEvents(ended, sleepWindowOf(db.settings), now),
		}
	})
}

function requireRunning(id: string) {
	const session = find(db.sessions, id)

	if (session.status !== "running") {
		throw new ApiError(409, "SESSION__NOT_RUNNING", "Session is not running")
	}

	return session
}

function allSounds() {
	return db.sessions.flatMap((session) => session.sounds)
}

function parrotSounds() {
	return allSounds()
		.filter((sound) => sound.is_parrot_sound === true)
		.sort((a, b) => Date.parse(b.captured_at) - Date.parse(a.captured_at))
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

function playsBetween(session: MockSession, from: number, to: number) {
	return plays(learningMsBetween(session, sleepWindowOf(db.settings), from, to, Date.now()))
}

function newestStartFirst(a: MockSession, b: MockSession) {
	return Date.parse(b.started_at) - Date.parse(a.started_at)
}

const APP_UPDATE = {
	latest_version: "1.2.0",
	min_supported_version: "1.0.0",
	release_notes: [],
}

let requestLocale: () => MockLocale = () => "en-US"

function consentDto(consent: MockConsent) {
	return {
		...consent,
		title: consent.title[requestLocale()],
		body: consent.body[requestLocale()],
	}
}

export const mockServer = {
	appUpdate: {
		get: () => respond(() => APP_UPDATE),
	},
	configure: (clientDeviceId: string, locale: () => MockLocale) => {
		requestLocale = locale

		db.devices = db.devices.map((device) =>
			device.id === db.currentDeviceId
				? { ...device, client_device_id: clientDeviceId }
				: device,
		)
	},
	uploads: {
		put: (fileId: string, uri: string, durationMs = 0) =>
			respond(() => {
				const saveUploadedFile = pendingUploads.get(fileId)

				if (!saveUploadedFile) {
					throw notFound()
				}

				pendingUploads.delete(fileId)
				saveUploadedFile(uri, durationMs)
			}),
	},
	users: {
		me: () => respond(() => db.user),
		update: (input: { nickname?: string | null }) =>
			respond(() => {
				if (
					input.nickname &&
					TAKEN_NICKNAMES.includes(input.nickname.trim().toLowerCase())
				) {
					throw new ApiError(409, "USER__DUPLICATE_NICKNAME", "Nickname already in use")
				}

				db.user = {
					...db.user,
					...(input.nickname === undefined
						? {}
						: { nickname: input.nickname?.trim() ?? null }),
				}
			}),
		issuePhotoUpload: () =>
			respond(() =>
				issueUpload((uri) => {
					db.user = { ...db.user, photo: { url: uri } }
				}),
			),
		deletePhoto: () =>
			respond(() => {
				db.user = { ...db.user, photo: null }
			}),
	},
	settings: {
		get: () => respond(() => db.settings),
		updateSleep: (sleep: { sleep_at: string; wake_at: string }) =>
			respond(() => {
				db.settings = { ...db.settings, sleep }

				return db.settings
			}),
		updateNotifications: (notifications: typeof db.settings.notifications) =>
			respond(() => {
				db.settings = { ...db.settings, notifications }

				return db.settings
			}),
	},
	consents: {
		list: () => respond(() => db.consents.map(consentDto)),
		save: (decision: { consent_id: string; status: "granted" | "denied" }) =>
			respond(() => {
				const consent = find(db.consents, decision.consent_id)

				db.consents = db.consents.map((item) =>
					item.id === consent.id ? { ...item, status: decision.status } : item,
				)

				return {
					consent_id: consent.id,
					kind: consent.kind,
					version: consent.version,
					status: decision.status,
					decided_at: iso(Date.now()),
				}
			}),
	},
	parrots: {
		list: () => respond(() => db.parrots),
		create: (input: { name: string; species: string; birthdate?: string | null }) =>
			respond(() => {
				const parrot = {
					id: randomUUID(),
					name: input.name.trim(),
					species: input.species.trim(),
					birthdate: input.birthdate ?? null,
					photo: null,
				}

				db.parrots = [...db.parrots, parrot]

				return parrot
			}),
		update: (
			id: string,
			input: { name?: string; species?: string; birthdate?: string | null },
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
		issuePhotoUpload: (id: string) =>
			respond(() => {
				find(db.parrots, id)

				return issueUpload((uri) => {
					db.parrots = db.parrots.map((item) =>
						item.id === id ? { ...item, photo: { url: uri } } : item,
					)
				})
			}),
		deletePhoto: (id: string) =>
			respond(() => {
				find(db.parrots, id)
				db.parrots = db.parrots.map((item) =>
					item.id === id ? { ...item, photo: null } : item,
				)
			}),
	},
	words: {
		list: () => respond(() => db.words.map(wordDto)),
		get: (id: string) => respond(() => wordDto(find(db.words, id))),
		create: (name: string) =>
			respond(() => {
				const word = { id: randomUUID(), name: name.trim(), recordings: [] }

				db.words = [...db.words, word]

				return wordDto(word)
			}),
		update: (id: string, name: string) =>
			respond(() => {
				const word = { ...find(db.words, id), name: name.trim() }

				db.words = db.words.map((item) => (item.id === id ? word : item))

				return wordDto(word)
			}),
		remove: (id: string) =>
			respond(() => {
				find(db.words, id)
				db.words = db.words.filter((item) => item.id !== id)
			}),
		issueRecordingUpload: (id: string) =>
			respond(() => {
				if (find(db.words, id).recordings.length >= MAX_RECORDINGS) {
					throw new ApiError(422, "WORD__RECORDING_LIMIT", "Recording limit reached")
				}

				return issueUpload((uri, durationMs) => {
					const recording = {
						id: randomUUID(),
						url: uri,
						duration_ms: durationMs,
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
				})
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
		recordingStatus: (id: string) =>
			respond(() =>
				find(db.words, id).recordings.map((recording) => ({
					recording_id: recording.id,
					duration_ms: recording.duration_ms,
					status: recording.status,
				})),
			),
	},
	devices: {
		list: () => respond(() => db.devices.map(deviceDto)),
		register: (input: {
			client_device_id: string
			platform: string
			os_version: string
			model: string
			app_version: string
			timezone?: string | null
		}) =>
			respond(() => {
				const currentDevice = find(db.devices, db.currentDeviceId)
				const { client_device_id, timezone, ...client } = input
				const registered = {
					...currentDevice,
					client_device_id,
					timezone: timezone ?? null,
					client,
				}

				db.devices = db.devices.map((item) =>
					item.id === currentDevice.id ? registered : item,
				)

				return deviceDto(registered)
			}),
		updateMe: (input: {
			app_version?: string
			os_version?: string
			timezone?: string | null
		}) =>
			respond(() => {
				const currentDevice = find(db.devices, db.currentDeviceId)
				const { timezone, ...client } = input
				const updated = {
					...currentDevice,
					timezone: timezone === undefined ? currentDevice.timezone : timezone,
					client: { ...currentDevice.client, ...client },
				}

				db.devices = db.devices.map((item) =>
					item.id === currentDevice.id ? updated : item,
				)

				return deviceDto(updated)
			}),
		updatePushToken: (_token: string) =>
			respond(() => {
				const currentDevice = find(db.devices, db.currentDeviceId)

				db.devices = db.devices.map((item) =>
					item.id === currentDevice.id ? { ...item, push_registered: true } : item,
				)

				return deviceDto({ ...currentDevice, push_registered: true })
			}),
		disconnectMe: () =>
			respond(() => {
				db.devices = db.devices.filter((device) => device.id !== db.currentDeviceId)
			}),
		names: () =>
			respond(() =>
				db.devices.map((device) => ({ device_id: device.id, name: device.name })),
			),
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
	},
	sessions: {
		list: (pageNumber: number) =>
			respond(() =>
				toPage([...db.sessions].sort(newestStartFirst).map(sessionDto), pageNumber),
			),
		range: (from: number, to: number) =>
			respond(() =>
				db.sessions
					.filter((session) => overlaps(session, from, to))
					.sort(newestStartFirst)
					.map(sessionDto),
			),
		detail: (id: string) => respond(() => sessionDto(find(db.sessions, id))),
		start: (input: { word_id?: string | null; learning_enabled: boolean }) =>
			respond(() => {
				if (runningRecord()) {
					throw new ApiError(
						409,
						"SESSION__ALREADY_RUNNING",
						"Another session is running",
					)
				}

				const now = Date.now()
				const wordId = input.word_id ?? null

				if (wordId) {
					find(db.words, wordId)
				}

				const session: MockSession = {
					id: randomUUID(),
					status: "running",
					started_at: iso(now),
					ended_at: null,
					ended_by: null,
					word_id: wordId,
					learning_enabled: input.learning_enabled,
					station_device_id: db.currentDeviceId,
					settings_version: 1,
					applied_settings_version: 0,
					last_heartbeat_at: null,
					events: [event("session_started", now)],
					sleep_events: [],
					sounds: [],
					activity: [],
				}

				db.sessions = [...db.sessions, session]

				return sessionDto(session)
			}),
		finish: (id: string) =>
			respond(() => {
				requireRunning(id)
				finish(id, "user")

				return sessionDto(find(db.sessions, id))
			}),
		heartbeat: (id: string, input: { applied_settings_version: number }) =>
			respond(() => {
				requireRunning(id)
				replaceSession(id, (current) => ({
					...current,
					applied_settings_version: input.applied_settings_version,
					last_heartbeat_at: iso(Date.now()),
				}))

				const session = sessionDto(find(db.sessions, id))

				return {
					session: { status: session.status, settings: session.settings },
					acknowledged: [],
				}
			}),
		addEvents: (
			id: string,
			input: {
				events: { kind: MockEvent["kind"]; occurred_at: string; word_id?: string | null }[]
			},
		) =>
			respond(() => {
				requireRunning(id)
				replaceSession(id, (current) => ({
					...current,
					events: [
						...current.events,
						...input.events.map((item) =>
							event(item.kind, Date.parse(item.occurred_at), {
								word_id: item.word_id ?? null,
							}),
						),
					],
				}))
			}),
		events: (id: string) => respond(() => find(db.sessions, id).events.map(eventDto)),
		sounds: (id: string, pageNumber: number) =>
			respond(() => toPage(find(db.sessions, id).sounds.map(soundDto), pageNumber)),
		issueSoundUpload: (id: string, capturedAt: string) =>
			respond(() => {
				requireRunning(id)

				return issueUpload((uri) => {
					const sound: MockSound = {
						id: randomUUID(),
						session_id: id,
						captured_at: capturedAt,
						audio_url: uri,
						analyzed: false,
						word_id: null,
						is_parrot_sound: null,
						score: null,
						feedback: null,
					}

					replaceSession(id, (session) => ({
						...session,
						sounds: [...session.sounds, sound],
					}))
				})
			}),
		activity: (id: string) => respond(() => find(db.sessions, id).activity),
		plays: (id: string) =>
			respond(() => {
				const session = find(db.sessions, id)

				return playsBetween(session, Date.parse(session.started_at), Date.now())
			}),
		eventExtras: (id: string) =>
			respond(() => {
				const session = find(db.sessions, id)

				return {
					sleep_events:
						session.status === "running"
							? sleepEvents(session, sleepWindowOf(db.settings), Date.now())
							: session.sleep_events,
				}
			}),
	},
	sounds: {
		feedback: () =>
			respond(() =>
				allSounds().map((sound) => ({ sound_id: sound.id, feedback: sound.feedback })),
			),
		analysis: () =>
			respond(() =>
				allSounds().map((sound) => ({
					sound_id: sound.id,
					is_parrot_sound: sound.is_parrot_sound,
					score: sound.score,
				})),
			),
		saveFeedback: (soundId: string, feedback: "up" | "down") =>
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
	parrotSounds: {
		list: (pageNumber: number) =>
			respond(() => toPage(parrotSounds().map(soundDto), pageNumber)),
	},
	notifications: {
		list: (pageNumber: number) =>
			respond(() => toPage(db.notifications.map(notificationDto), pageNumber)),
		read: (id: string) =>
			respond(() => {
				const now = iso(Date.now())
				const markRead = <T extends { id: string; read_at: string | null }>(item: T): T =>
					item.id === id && !item.read_at ? { ...item, read_at: now } : item

				if (
					![...db.notifications, ...db.noticeNotifications].some((item) => item.id === id)
				) {
					throw notFound()
				}

				db.notifications = db.notifications.map(markRead)
				db.noticeNotifications = db.noticeNotifications.map(markRead)
			}),
		readAll: () =>
			respond(() => {
				const now = iso(Date.now())

				db.notifications = db.notifications.map((item) =>
					item.read_at ? item : { ...item, read_at: now },
				)
				db.noticeNotifications = db.noticeNotifications.map((item) =>
					item.read_at ? item : { ...item, read_at: now },
				)
			}),
		notices: () =>
			respond(() => ({
				notices: db.noticeNotifications,
				notification_sessions: db.notifications.flatMap((item) =>
					item.session_id
						? [{ notification_id: item.id, session_id: item.session_id }]
						: [],
				),
			})),
	},
	notices: {
		list: (pageNumber: number) =>
			respond(() =>
				toPage(
					[...db.notices].sort(
						(a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at),
					),
					pageNumber,
				),
			),
		get: (id: string) => respond(() => find(db.notices, id)),
		read: (id: string) =>
			respond(() => {
				find(db.notices, id)
				db.notices = db.notices.map((notice) =>
					notice.id === id ? { ...notice, is_read: true } : notice,
				)

				return find(db.notices, id)
			}),
	},
	feedback: {
		create: (message: string) =>
			respond(() => ({
				id: randomUUID(),
				user_id: db.user.id,
				device_id: db.currentDeviceId,
				message: message.trim(),
				app_version: find(db.devices, db.currentDeviceId).client.app_version,
				created_at: iso(Date.now()),
			})),
	},
	reports: {
		get: (period: "day" | "week" | "month", start: string) =>
			respond(() => {
				const { from, to } = reportRange(period, start)
				const sessions = db.sessions.filter((session) => overlaps(session, from, to))
				const counts = new Map<
					string,
					{ word: { id: string; name: string }; play_count: number }
				>()
				let totalCount = 0
				let totalDuration = 0

				for (const session of sessions) {
					const played = playsBetween(session, from, to)
					const word = db.words.find((item) => item.id === session.word_id)

					totalCount += played.play_count
					totalDuration += played.play_duration_ms

					if (word && played.play_count > 0) {
						counts.set(word.id, {
							word: { id: word.id, name: word.name },
							play_count: (counts.get(word.id)?.play_count ?? 0) + played.play_count,
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
					mimicry_count: sounds.filter((sound) => sound.word_id).length,
					trend: buckets(period, from, to).map((bucket) => ({
						start: iso(bucket.start),
						play_duration_ms: sessions.reduce(
							(sum, session) =>
								sum +
								playsBetween(session, bucket.start, bucket.end).play_duration_ms,
							0,
						),
					})),
					words: [...counts.values()].sort((a, b) => b.play_count - a.play_count),
					sounds: sounds.map(soundDto),
				}
			}),
	},
}
