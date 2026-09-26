import { useMutation, useQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"
import { AppState } from "react-native"

import {
	finishSessionMutationOptions,
	runningSessionQueryOptions,
	uploadSoundMutationOptions,
} from "@/hooks/apis/sessions"
import { useIdempotentMutation } from "@/hooks/apis/use-idempotent-mutation"
import { wordsQueryOptions } from "@/hooks/apis/words"
import { useHeartbeat } from "@/screens/Session/hooks/use-heartbeat"
import { createLearningEngine, type LearningEngine } from "@/services/learning/engine"
import { reportError, track } from "@/services/telemetry/client"
import type { RootStackParamList } from "@/types/navigation"

type EndReason = "completed" | "user" | "server"

export type LearningSession = {
	startedAt: string | null
	failed: boolean
	ending: boolean
	endFailed: boolean
	end(): void
}

export function useLearningSession(
	{ sessionId, wordId, endsAt, sleep }: RootStackParamList["SessionRun"],
	onFinished: (learningMs: number) => void,
): LearningSession {
	const running = useQuery(runningSessionQueryOptions())
	const words = useQuery(wordsQueryOptions())

	const { mutateAsync: upload } = useMutation(uploadSoundMutationOptions())
	const finishing = useIdempotentMutation(finishSessionMutationOptions())

	const engine = useRef<LearningEngine | null>(null)
	const uploads = useRef<Promise<unknown>[]>([])
	const closing = useRef(false)
	const learned = useRef<number | null>(null)
	const finished = useRef(onFinished)

	const [failed, setFailed] = useState(false)
	const [ending, setEnding] = useState(false)

	const session = running.data?.id === sessionId ? running.data : null
	const startedAt = session?.period.started_at ?? null
	const recordingKey =
		words.data
			?.find((word) => word.id === wordId)
			?.recordings.map((item) => item.url)
			.join("|") ?? ""

	useEffect(() => {
		finished.current = onFinished
	}, [onFinished])

	const close = useCallback(
		async (reason: EndReason) => {
			if (closing.current) {
				return
			}

			closing.current = true
			setEnding(true)

			try {
				learned.current ??= engine.current?.learningMs() ?? 0

				const learningMs = learned.current

				await engine.current?.stop()
				engine.current = null

				await Promise.allSettled(uploads.current)

				if (reason !== "server") {
					await finishing.mutateAsync({ id: sessionId })
				}

				if (reason === "completed" || (reason === "user" && endsAt === null)) {
					track("learning_completed", {
						session_id: sessionId,
						learning_duration_ms: learningMs,
						total_duration_ms: startedAt ? Date.now() - Date.parse(startedAt) : 0,
					})
				} else {
					track("learning_aborted", {
						session_id: sessionId,
						learning_duration_ms: learningMs,
						reason,
					})
				}

				finished.current(learningMs)
			} catch (error) {
				closing.current = false

				reportError(error, "learning_end")
			} finally {
				setEnding(false)
			}
		},
		[endsAt, finishing, sessionId, startedAt],
	)

	useHeartbeat({
		sessionId,
		appliedVersion: session?.settings.version ?? 1,
		startedAt,
		sleep,
		summaries: () => engine.current?.summaries() ?? [],
		onEnded: () => void close("server"),
	})

	useEffect(() => {
		const urls = recordingKey ? recordingKey.split("|") : []

		if (!startedAt || urls.length === 0) {
			return
		}

		const created = createLearningEngine({
			wordId,
			recordingUrls: urls,
			startedAt: Date.parse(startedAt),
			sleep: { sleepAt: sleep.sleep_at, wakeAt: sleep.wake_at },
			onSound: (sound) => {
				const pending: Promise<unknown> = upload({
					sessionId,
					uri: sound.uri,
					capturedAt: sound.capturedAt,
					idempotencyKey: sound.uri,
				})
					.catch((error: unknown) => reportError(error, "session_sound_upload"))
					.finally(() => {
						uploads.current = uploads.current.filter((item) => item !== pending)
					})

				uploads.current = [...uploads.current, pending]
			},
			onError: (error) => reportError(error, "learning_engine"),
		})

		engine.current = created

		let queue = created
			.start()
			.then(() =>
				track("learning_started", {
					session_id: sessionId,
					word_id: wordId,
					...(endsAt === null ? {} : { duration_ms: endsAt - Date.parse(startedAt) }),
				}),
			)
			.catch((error: unknown) => {
				reportError(error, "learning_start")
				track("learning_aborted", {
					session_id: sessionId,
					learning_duration_ms: 0,
					reason: "error",
				})

				setFailed(true)
			})

		const run = (step: () => Promise<void>) => {
			queue = queue
				.then(step)
				.catch((error: unknown) => reportError(error, "learning_engine"))
		}

		const lifecycle = AppState.addEventListener("change", (state) => {
			run(() => (state === "active" ? created.resume() : created.pause()))
		})

		return () => {
			lifecycle.remove()

			if (engine.current === created) {
				engine.current = null

				run(() => created.stop())
			}
		}
	}, [endsAt, recordingKey, sessionId, sleep, startedAt, upload, wordId])

	useEffect(() => {
		if (endsAt === null) {
			return
		}

		const timer = setTimeout(() => void close("completed"), Math.max(0, endsAt - Date.now()))

		return () => clearTimeout(timer)
	}, [close, endsAt])

	return {
		startedAt,
		failed,
		ending,
		endFailed: finishing.isError,
		end: () => void close("user"),
	}
}
