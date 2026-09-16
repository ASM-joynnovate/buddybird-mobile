import type  { AppData } from "@/types/app-data"
import type  { Capture } from "@/types/capture"
import type  { Profile } from "@/types/profile"
import type  { Progress } from "@/types/progress"
import type  { History, SessionDraft, SessionSettings } from "@/types/session"
import type  { Word, WordSnapshot } from "@/types/word"
import {
	readNullableText,
	readOptionalText,
	requireChoice,
	requireId,
	requireList,
	requireNonnegativeNumber,
	requireRecord,
	requireText,
} from "@/utils/validation"

function recordId(value: unknown, id: string) {
	const record = requireRecord(value, id)

	requireId(id)

	if (record.id !== id) {
		throw new Error(`Record key mismatch: ${id}`)
	}

	return record
}

function textList(value: unknown, field: string) {
	return requireList(value, field).map((entry) => requireText(entry, field))
}

export function readProfile(value: unknown): Profile {
	const record = requireRecord(value, "profile")
	const species = requireText(record.species, "species")

	if (species === "parakeet" || (species === "custom" && record.customSpecies !== undefined)) {
		throw new Error("Legacy profile species requires import")
	}

	return {
		id: requireText(record.id, "profile.id"),
		name: requireText(record.name, "profile.name"),
		species,
		birthDate: readNullableText(record.birthDate, "birthDate"),
		photoUri: readOptionalText(record.photoUri, "photoUri"),
		createdAt: requireText(record.createdAt, "createdAt"),
		updatedAt: requireText(record.updatedAt, "updatedAt"),
	}
}

export function readWordSnapshot(value: unknown): WordSnapshot {
	const record = requireRecord(value, "word snapshot")

	return {
		label: requireText(record.label, "word.label"),
		sourceType: requireChoice(
			record.sourceType,
			["preset", "recording"] as const,
			"sourceType",
		),
		audioUri: requireText(record.audioUri, "word.audioUri"),
		presetKey: readOptionalText(record.presetKey, "presetKey"),
		transformedAudioUri: readOptionalText(record.transformedAudioUri, "transformedAudioUri"),
		libraryEntryId: readOptionalText(record.libraryEntryId, "libraryEntryId"),
	}
}

export function readSessionSettings(value: unknown): SessionSettings {
	const record = requireRecord(value, "session settings")

	return {
		wordId: requireText(record.wordId, "wordId"),
		sourceType: requireChoice(
			record.sourceType,
			["preset", "recording"] as const,
			"sourceType",
		),
		libraryEntryId: readOptionalText(record.libraryEntryId, "libraryEntryId"),
		totalDurationSeconds: requireNonnegativeNumber(
			record.totalDurationSeconds,
			"totalDurationSeconds",
		),
		learningDurationSeconds: requireNonnegativeNumber(
			record.learningDurationSeconds,
			"learningDurationSeconds",
		),
		restDurationSeconds: requireNonnegativeNumber(
			record.restDurationSeconds,
			"restDurationSeconds",
		),
		stressCareDurationSeconds: requireNonnegativeNumber(
			record.stressCareDurationSeconds,
			"stressCareDurationSeconds",
		),
	}
}

export function readStoredWord(value: unknown, id: string): Word {
	const record = recordId(value, id)

	if (record.archived !== undefined && typeof record.archived !== "boolean") {
		throw new Error(`Invalid archived state: ${id}`)
	}

	return {
		id,
		...readWordSnapshot(record),
		tag: requireChoice(record.tag, ["greeting", "food", "name", "etc"] as const, "tag"),
		createdAt: requireText(record.createdAt, "word.createdAt"),
		updatedAt: requireText(record.updatedAt, "word.updatedAt"),
		archived: record.archived as boolean | undefined,
	}
}

export function readHistory(value: unknown, id: string): History {
	const record = recordId(value, id)

	return {
		...readSessionSettings(record),
		id,
		word: readWordSnapshot(record.word),
		startedAt: requireText(record.startedAt, "startedAt"),
		endedAt: readOptionalText(record.endedAt, "endedAt"),
		completedCycles: requireNonnegativeNumber(record.completedCycles, "completedCycles"),
		totalLearningSeconds: requireNonnegativeNumber(
			record.totalLearningSeconds,
			"totalLearningSeconds",
		),
	}
}

export function readProgress(value: unknown, id: string): Progress {
	const record = requireRecord(value, id)

	requireId(id)

	if (record.wordId !== id) {
		throw new Error(`Progress key mismatch: ${id}`)
	}

	return {
		wordId: id,
		totalTrainingSeconds: requireNonnegativeNumber(
			record.totalTrainingSeconds,
			"totalTrainingSeconds",
		),
		sessionCount: requireNonnegativeNumber(record.sessionCount, "sessionCount"),
		successMarkedAt: readOptionalText(record.successMarkedAt, "successMarkedAt"),
		updatedAt: requireText(record.updatedAt, "updatedAt"),
	}
}

export function readSessionDraft(value: unknown, id: string): SessionDraft {
	const record = recordId(value, id)

	if (record.metricsCredited !== undefined && typeof record.metricsCredited !== "boolean") {
		throw new Error(`Invalid session receipt: ${id}`)
	}

	return {
		id,
		settings: readSessionSettings(record.settings),
		word: readWordSnapshot(record.word),
		startedAt: requireText(record.startedAt, "startedAt"),
		clientWordId: requireText(record.clientWordId, "clientWordId"),
		parrotSpecies: readNullableText(record.parrotSpecies, "parrotSpecies"),
		parrotBirthdate: readNullableText(record.parrotBirthdate, "parrotBirthdate"),
		metricsCredited: record.metricsCredited as boolean | undefined,
		captureCount:
			record.captureCount === undefined
				? undefined
				: requireNonnegativeNumber(record.captureCount, "captureCount"),
	}
}

function readCapture(value: unknown, id: string): Capture {
	const record = recordId(value, id)

	for (const field of ["sessionId", "wordId", "clientWordId", "capturedAt", "uri", "fileName"]) {
		requireText(record[field], field)
	}

	readNullableText(record.parrotSpecies, "parrotSpecies")
	readNullableText(record.parrotBirthdate, "parrotBirthdate")
	requireNonnegativeNumber(record.cycle, "cycle")
	requireNonnegativeNumber(record.sizeBytes, "sizeBytes")
	requireChoice(record.phase, ["learning", "rest"] as const, "phase")

	for (const item of requireList(record.segments, "segments")) {
		const segment = requireRecord(item, "segment")
		const start = requireNonnegativeNumber(segment.startMs, "startMs")
		const end = requireNonnegativeNumber(segment.endMs, "endMs")

		if (end < start) {
			throw new Error(`Invalid capture segment: ${id}`)
		}
	}

	return record as Capture
}

export function decodeData(serialized: string): AppData {
	const value = requireRecord(JSON.parse(serialized), "app data")

	if (value.version !== 2) {
		throw new Error("Unsupported app data version")
	}

	const migration = requireRecord(value.migration, "migration")

	if (typeof migration.complete !== "boolean") {
		throw new Error("Invalid migration status")
	}

	textList(migration.completed, "migration receipts")

	for (const issue of requireList(migration.issues, "migration issues")) {
		const record = requireRecord(issue, "migration issue")

		requireText(record.key, "issue key")
		requireText(record.message, "issue message")
	}

	if (value.profile !== null) {
		readProfile(value.profile)
	}

	for (const [key, read] of [
		["words", readStoredWord],
		["history", readHistory],
		["progress", readProgress],
		["sessionDrafts", readSessionDraft],
		["captures", readCapture],
	] as const) {
		for (const [id, entry] of Object.entries(requireRecord(value[key], key))) {
			read(entry, id)
		}
	}

	for (const [id, alias] of Object.entries(requireRecord(value.wordAliases, "word aliases"))) {
		requireId(id)
		requireId(alias)
	}

	for (const key of ["nativeCaptureReceipts", "pendingWords", "pendingFileDeletes"]) {
		textList(value[key], key)
	}

	const settings = requireRecord(value.settings, "settings")
	const consent = requireRecord(settings.uploadConsent, "upload consent")

	requireChoice(
		consent.status,
		["unknown", "granted", "denied"] as const,
		"upload consent status",
	)
	readNullableText(consent.decidedAt, "consent date")
	requireNonnegativeNumber(consent.noticeVersion, "notice version")

	if (settings.lastSession !== undefined) {
		readSessionSettings(settings.lastSession)
	}

	if (settings.push !== null) {
		const push = requireRecord(settings.push, "push registration")

		readNullableText(push.token, "push token")
		requireChoice(
			push.authorizationStatus,
			["not_determined", "denied", "authorized", "provisional", "ephemeral"] as const,
			"push authorization",
		)
		requireText(push.updatedAt, "push date")
	}

	for (const receipt of requireList(settings.receipts, "push receipts")) {
		const record = requireRecord(receipt, "push receipt")

		readNullableText(record.messageId, "message ID")
		readNullableText(record.from, "push sender")

		if (record.sentTime !== null) {
			requireNonnegativeNumber(record.sentTime, "push sent time")
		}

		requireChoice(
			record.source,
			["foreground", "background", "notification_opened"] as const,
			"push source",
		)
		requireText(record.receivedAt, "push received time")
	}

	for (const [id, metric] of Object.entries(
		requireRecord(settings.wordMetrics, "word metrics"),
	)) {
		const record = requireRecord(metric, id)

		requireId(id)
		requireId(record.word_id)
		requireText(record.word_name, "metrics word name")

		for (const key of [
			"lifetime_practice_count",
			"lifetime_practice_duration_ms",
			"lifetime_recording_count",
		]) {
			requireNonnegativeNumber(record[key], key)
		}

		readNullableText(record.last_practiced_at_iso, "last practice date")
	}

	return value as AppData
}
