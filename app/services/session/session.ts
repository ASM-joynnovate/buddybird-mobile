import { AudioModule } from "expo-audio"
import { randomUUID } from "expo-crypto"

import { resolveAudio, stressCareAudio } from "@/services/media/audio"
import { drainFileDeletes } from "@/services/media/cleanup"
import { inspect } from "@/services/media/inspect"
import { practiceDurationMs, abandonedProgress } from "@/services/session/history"
import { captureDirectory } from "@/services/media/files"
import { resolveRecordingUri } from "@/services/media/uri"
import { transferNativeState } from "@/services/session/transfer"
import { readData, updateData } from "@/services/storage/data-store"
import { reportError, reserveEvents, track } from "@/services/telemetry/client"
import { currentWord } from "@/services/words/selectors"
import { CAPTURE_STORAGE_LIMIT_BYTES } from "@/types/capture"
import type { SessionDraft, SessionSettings } from "@/types/session"
import engine, { defaultVAD, type SessionInput, type SessionSnapshot } from "@modules/session-audio-engine"

let reconciliation: Promise<void> | undefined
let reconcileAgain = false

/** Native checkpoints and manifests are retained on any failed save/ACK/clear. */
export function recoverNativeData(): Promise<void> {
	if (reconciliation) {
		reconcileAgain = true

		return reconciliation
	}

	reconciliation = (async () => {
		do {
			reconcileAgain = false
			await transferNativeState(engine, {
				read: readData,
				update: updateData,
				inspect,
				resolve: resolveRecordingUri,
				error: (error) => reportError(error, "capture_recovery"),
				captureSaved: (capture, pendingCount) => {
					track("follow_along_capture_created", {
						client_capture_id: capture.id,
						session_id: capture.sessionId,
						client_word_id: capture.clientWordId,
						cycle: capture.cycle,
						phase: capture.phase,
						audio_size_bytes: capture.sizeBytes,
						pending_count: pendingCount,
					})
				},
				captureEvicted: (eviction, capture) => {
					const age = Date.now() - Date.parse(capture?.capturedAt ?? eviction.capturedAt)

					track("capture_evicted_before_upload", {
						client_capture_id: capture?.id ?? eviction.segmentId,
						audio_size_bytes: eviction.sizeBytes,
						...(Number.isFinite(age) ? { age_ms: Math.max(0, age) } : {}),
					})
				},
				finalized: (recovery, draft) => {
					const count = draft.captureCount ?? 0
					const data = readData()
					const metrics =
						data.settings.wordMetrics[
							draft.settings.libraryEntryId ??
								data.wordAliases[draft.settings.wordId] ??
								draft.settings.wordId
						]

					if (metrics) {
						const lastPracticedAt = Date.parse(
							metrics.last_practiced_at_iso ?? recovery.snapshot.savedAt,
						)

						track("word_lifetime_metrics", {
							word_id: metrics.word_id,
							word_name: metrics.word_name,
							lifetime_practice_count: metrics.lifetime_practice_count,
							lifetime_practice_duration_ms: metrics.lifetime_practice_duration_ms,
							lifetime_recording_count: metrics.lifetime_recording_count,
							last_practiced_at_days_ago: Math.max(
								0,
								Math.floor((Date.now() - lastPracticedAt) / 86_400_000),
							),
						})
					}

					if (recovery.reason === "duration-reached") {
						track("word_practice_completed", {
							session_id: recovery.sessionId,
							word_id: draft.settings.wordId,
							word_name: draft.word.label,
							practice_duration_ms: recovery.snapshot.elapsedRunningMs,
							recordings_count: count,
							replay_count: Math.max(0, recovery.snapshot.targetPlaybackCount - 1),
						})
						const referenceCount = draft.word.audioUri ? 1 : 0

						track("training_session_completed", {
							session_id: recovery.sessionId,
							total_duration_ms: practiceDurationMs(recovery),
							words_practiced_count: 1,
							words_recorded_count: referenceCount,
							words_skipped_count: 0,
							total_recordings: referenceCount,
							avg_recording_duration_ms: referenceCount
								? draft.settings.learningDurationSeconds * 1000
								: 0,
						})
					} else {
						track("training_session_abandoned", {
							session_id: recovery.sessionId,
							duration_ms: practiceDurationMs(recovery),
							progress_percent: abandonedProgress(recovery),
							last_word_id: draft.settings.wordId,
							last_word_name: draft.word.label,
						})
					}
				},
			})
			await drainFileDeletes()
		} while (reconcileAgain)
	})().finally(() => {
		reconciliation = undefined
	})

	return reconciliation
}

export async function startSession(
	wordId: string,
	settings: Omit<SessionSettings, "wordId" | "sourceType" | "libraryEntryId">,
	notification: SessionInput["notification"],
): Promise<SessionSnapshot> {
	await recoverNativeData()
	const data = readData()
	const word = currentWord(data, wordId)

	if (!word || word.archived || !data.profile) {
		throw new Error("Choose a word and profile first")
	}

	if (
		![settings.totalDurationSeconds, settings.learningDurationSeconds].every(
			(value) => Number.isFinite(value) && value > 0,
		) ||
		![settings.restDurationSeconds, settings.stressCareDurationSeconds].every(
			(value) => Number.isFinite(value) && value >= 0,
		)
	) {
		throw new Error("Invalid session duration")
	}

	if (!(await AudioModule.requestRecordingPermissionsAsync()).granted) {
		throw Object.assign(new Error("Microphone permission required"), {
			code: "permission-denied",
			recoverable: true,
		})
	}

	let targetAudioUri: string
	let care: string[]

	try {
		targetAudioUri = await resolveAudio(word)
		care = settings.stressCareDurationSeconds > 0 ? await stressCareAudio() : []
	} catch (cause) {
		throw Object.assign(
			new Error(cause instanceof Error ? cause.message : "Audio source unavailable"),
			{
				code: "audio-source-unavailable",
				recoverable: false,
			},
		)
	}

	const id = `sess_${Date.now().toString(36)}_${randomUUID().replace(/-/g, "").slice(0, 10)}`
	const previousId =
		Object.keys(data.wordAliases).find((key) => data.wordAliases[key] === word.id) ?? word.id
	const sessionSettings: SessionSettings = {
		...settings,
		wordId: previousId,
		sourceType: word.sourceType,
		libraryEntryId: word.id,
	}
	const draft: SessionDraft = {
		id,
		settings: sessionSettings,
		startedAt: new Date().toISOString(),
		word: {
			label: word.label,
			sourceType: word.sourceType,
			audioUri: word.audioUri,
			...(word.presetKey ? { presetKey: word.presetKey } : {}),
			libraryEntryId: word.id,
		},
		clientWordId: word.presetKey ? `preset-${word.presetKey}` : word.id,
		parrotSpecies: data.profile.species,
		parrotBirthdate: data.profile.birthDate,
	}

	updateData((next) => {
		next.sessionDrafts[id] = draft
		next.settings.lastSession = sessionSettings
	})

	const metrics = data.settings.wordMetrics[word.id]
	const wordEvent = { session_id: id, word_id: previousId, word_name: word.label }
	const settle = reserveEvents([
		{
			name: "training_session_started",
			params: {
				session_id: id,
				word_count: 1,
				target_word_ids: [previousId],
				target_word_names: [word.label],
				profile_age_days: Math.max(
					0,
					Math.floor((Date.now() - Date.parse(data.profile.createdAt)) / 86_400_000),
				),
				parrot_species: data.profile.species,
				parrot_name: data.profile.name,
			},
		},
		{ name: "word_selected", params: { ...wordEvent, source: "list" } },
		{
			name: "word_practice_started",
			params: {
				...wordEvent,
				attempt_number: (metrics?.lifetime_practice_count ?? 0) + 1,
				cumulative_practice_count: metrics?.lifetime_practice_count ?? 0,
				cumulative_practice_duration_ms: metrics?.lifetime_practice_duration_ms ?? 0,
			},
		},
	])
	const confirmStart = (snapshot: SessionSnapshot) => {
		if (
			snapshot.sessionId === id &&
			(["running", "paused", "interrupted"].includes(snapshot.state) ||
				snapshot.elapsedRunningMs > 0)
		) {
			settle(true)
		}
	}

	let listener: { remove(): void } | undefined

	try {
		listener = engine.addListener("onStateChanged", confirmStart)
		const snapshot = await engine.start({
			sessionId: id,
			targetAudioUri,
			captureDirectoryUri: captureDirectory(),
			totalDurationMs: settings.totalDurationSeconds * 1000,
			learningDurationMs: settings.learningDurationSeconds * 1000,
			restDurationMs: settings.restDurationSeconds * 1000,
			stressCareDurationMs: settings.stressCareDurationSeconds * 1000,
			stressCareAudioUris: care,
			maxPendingCaptureBytes: CAPTURE_STORAGE_LIMIT_BYTES,
			vad: defaultVAD,
			recovery: {
				wordId: previousId,
				word: word.label,
				sourceType: word.sourceType,
				libraryEntryId: word.id,
				startedAt: draft.startedAt,
				wordSnapshot: { ...draft.word },
			},
			notification,
		})

		confirmStart(snapshot)

		if (snapshot.state === "idle" && snapshot.elapsedRunningMs === 0) {
			updateData((next) => {
				delete next.sessionDrafts[id]
			})
		}

		return snapshot
	} finally {
		listener?.remove()
		settle(false)
	}
}

export { engine }
