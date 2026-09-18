import i18next from "i18next"
import { useCallback, useEffect, useRef, useState } from "react"
import { AppState } from "react-native"

import type { SessionValue } from "@/context/session"
import { sessionFailure } from "@/services/session/failure"
import { engine, recoverNativeData, startSession } from "@/services/session/session"
import { readData } from "@/services/storage/data-store"
import { reportError, track } from "@/services/telemetry/client"
import { createPerformanceReporter } from "@/services/telemetry/performance"
import type { Timing } from "@/types/session"
import type {
	FailureCode,
	SessionFailure,
	SessionInput,
	SessionSnapshot,
} from "@modules/session-audio-engine"

const idle: SessionSnapshot = {
	sessionId: null,
	state: "idle",
	elapsedRunningMs: 0,
	cycle: 1,
	phase: "learning",
	phaseElapsedMs: 0,
	isTargetPlaying: false,
	savedAt: "",
	lastPlaybackStartDelayMs: null,
	targetPlaybackCount: 0,
	failure: null,
}

export function useSessionController() {
	const [snapshot, setSnapshot] = useState(idle)
	const [error, setError] = useState<SessionFailure | null>(null)

	const commandId = useRef(0)
	const latestSnapshot = useRef(snapshot)
	const performanceReporter = useRef<ReturnType<typeof createPerformanceReporter> | null>(null)
	const performanceSessionId = useRef<string | null>(null)
	const lastPlayed = useRef({ sessionId: "", sequence: 0 })

	const applySnapshot = useCallback((next: SessionSnapshot) => {
		latestSnapshot.current = next
		setSnapshot(next)

		if (next.failure) {
			setError(next.failure)
		}

		if (next.sessionId !== performanceSessionId.current) {
			performanceReporter.current?.stop()
			performanceSessionId.current = next.sessionId
			performanceReporter.current = next.sessionId
				? createPerformanceReporter(next.sessionId, () => ({
						consentStatus: readData().settings.uploadConsent.status,
					}))
				: null
		}

		performanceReporter.current?.setRunning(
			next.state === "running" && AppState.currentState === "active",
		)

		if (next.state === "running" && next.lastPlaybackStartDelayMs !== null) {
			performanceReporter.current?.audioDelay(
				next.lastPlaybackStartDelayMs,
				next.targetPlaybackCount,
			)
		}
	}, [])

	const recordSessionError = useCallback((cause: unknown, fallback?: FailureCode) => {
		const failure = sessionFailure(cause, fallback)
		const thrown = cause instanceof Error ? cause : new Error(failure.message)

		setError(failure)
		reportError(thrown, "session")

		return Object.assign(thrown, failure)
	}, [])

	const reconcileSessionData = useCallback(async () => {
		try {
			await recoverNativeData()

			// Saving recovery does not resolve a failed native audio start.
			if (latestSnapshot.current.state !== "failed") {
				setError(null)
			}
		} catch (cause) {
			throw recordSessionError(cause, "storage-unavailable")
		}
	}, [recordSessionError])

	useEffect(() => {
		void engine.getSnapshot().then(applySnapshot).catch(recordSessionError)
		void reconcileSessionData().catch((cause) => reportError(cause, "initial_recovery"))

		const state = engine.addListener("onStateChanged", (next) => {
			applySnapshot(next)

			if (["completed", "failed", "idle"].includes(next.state)) {
				void reconcileSessionData().catch(() => {})
			}
		})

		const progress = engine.addListener("onProgress", applySnapshot)

		const capture = engine.addListener("onSegmentCaptured", () => {
			void reconcileSessionData().catch(() => {})
		})

		const failure = engine.addListener("onFailure", (value) => {
			recordSessionError(value)
		})

		const playback = engine.addListener("onTargetPlayback", (value) => {
			if (
				value.sessionId !== latestSnapshot.current.sessionId ||
				(value.sessionId === lastPlayed.current.sessionId &&
					value.sequence <= lastPlayed.current.sequence)
			) {
				return
			}

			lastPlayed.current = { sessionId: value.sessionId, sequence: value.sequence }

			try {
				const data = readData()
				const draft = data.sessionDrafts[value.sessionId]
				const settings = draft?.settings ?? data.history[value.sessionId]
				const word = draft?.word ?? data.history[value.sessionId]?.word

				if (settings && word) {
					track("recording_played", {
						session_id: value.sessionId,
						word_id: settings.wordId,
						word_name: word.label,
						play_count: value.sequence,
						playback_duration_ms: value.durationMs,
					})
				}
			} catch (cause) {
				reportError(cause, "session_playback")
			}
		})

		const appState = AppState.addEventListener("change", (appStatus) => {
			if (appStatus !== "active") {
				performanceReporter.current?.setRunning(false)
			}

			if (appStatus === "active") {
				void engine.getSnapshot().then(applySnapshot).catch(recordSessionError)
				void reconcileSessionData().catch(() => {})
			} else if (
				appStatus === "background" &&
				latestSnapshot.current.sessionId &&
				latestSnapshot.current.state === "running"
			) {
				track("training_session_backgrounded", {
					session_id: latestSnapshot.current.sessionId,
					phase: latestSnapshot.current.phase,
					elapsed_seconds: latestSnapshot.current.elapsedRunningMs / 1000,
				})
			}
		})

		return () => {
			state.remove()
			progress.remove()
			capture.remove()
			failure.remove()
			playback.remove()
			appState.remove()
			performanceReporter.current?.stop()
		}
	}, [recordSessionError, applySnapshot, reconcileSessionData])

	async function runSessionCommand(action: () => Promise<SessionSnapshot>) {
		const id = ++commandId.current

		try {
			const next = await action()

			if (id !== commandId.current) {
				return
			}

			applySnapshot(next)

			if (next.state === "failed") {
				throw next.failure ?? new Error("Native audio command failed")
			}

			setError(null)
		} catch (cause) {
			if (id === commandId.current) {
				throw recordSessionError(cause)
			}
		}
	}

	async function start(wordId: string, settings: Timing) {
		const notification: SessionInput["notification"] = {
			learningSubtitle: i18next.t("session.notificationLearning"),
			restSubtitle: i18next.t("session.notificationRest"),
			stressCareSubtitle: i18next.t("session.notificationCare"),
			pausedSubtitle: i18next.t("session.notificationPaused"),
		}

		await runSessionCommand(() => startSession(wordId, settings, notification))
	}

	async function retry() {
		const failed = latestSnapshot.current

		if (failed.state !== "failed") {
			return
		}

		const data = readData()
		const id = failed.sessionId ?? ""
		const settings =
			data.sessionDrafts[id]?.settings ?? data.history[id] ?? data.settings.lastSession

		if (!settings) {
			throw recordSessionError(new Error("Failed session settings unavailable"))
		}

		// Normal startup persists/clears prior recovery before creating a new native session.
		await start(settings.libraryEntryId ?? settings.wordId, {
			totalDurationSeconds: settings.totalDurationSeconds,
			learningDurationSeconds: settings.learningDurationSeconds,
			restDurationSeconds: settings.restDurationSeconds,
			stressCareDurationSeconds: settings.stressCareDurationSeconds,
		})
	}

	const value: SessionValue = {
		snapshot,
		error,
		start,
		pause: () => runSessionCommand(() => engine.pause()),
		resume: () => runSessionCommand(() => engine.resume()),
		stop: async () => {
			await runSessionCommand(() => engine.stop())
			await reconcileSessionData()
			performanceReporter.current?.stop()
		},
		retry,
		retryRecovery: reconcileSessionData,
	}

	return value
}
