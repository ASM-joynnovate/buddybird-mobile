import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"
import { AppState } from "react-native"

import {
	finishSessionMutationOptions,
	runningSessionQueryOptions,
	uploadSoundMutationOptions,
} from "@/hooks/apis/sessions"
import { useIdempotentMutation } from "@/hooks/apis/use-idempotent-mutation"
import { wordQueryOptions } from "@/hooks/apis/words"
import { useHeartbeat } from "@/screens/Session/hooks/use-heartbeat"
import { createLearningEngine, type LearningEngine } from "@/services/learning/engine"
import { reportError, track } from "@/services/telemetry/client"
import { ApiError } from "@/types/apis/common"
import type { RootStackParamList } from "@/types/navigation"

type EndReason = "completed" | "user" | "server"

export type LearningSession = {
	startedAt: string | null
	failed: boolean
	ending: boolean
	end(): void
}

export function useLearningSession(
	{ sessionId, wordId, endsAt, sleep }: RootStackParamList["SessionRun"],
	onFinished: () => void,
): LearningSession {
	const queryClient = useQueryClient()

	const running = useQuery(runningSessionQueryOptions())

	const { mutateAsync: upload } = useIdempotentMutation(uploadSoundMutationOptions())
	const { mutateAsync: finish } = useIdempotentMutation(finishSessionMutationOptions())

	const engine = useRef<LearningEngine | null>(null)
	const uploads = useRef<Promise<unknown>[]>([])
	const closing = useRef(false)
	const finished = useRef(onFinished)

	const [failed, setFailed] = useState(false)
	const [ending, setEnding] = useState(false)

	const session = running.data?.id === sessionId ? running.data : null
	const startedAt = session?.period.started_at ?? null

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

			const learningMs = engine.current?.learningMs() ?? 0

			try {
				await engine.current?.stop()
				engine.current = null

				await Promise.allSettled(uploads.current)

				if (reason !== "server") {
					await finish({ id: sessionId })
				}
			} catch (error) {
				if (!(error instanceof ApiError && error.code === "SESSION__NOT_RUNNING")) {
					reportError(error, "learning_end")
				}
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

			finished.current()
		},
		[endsAt, finish, sessionId, startedAt],
	)

	useHeartbeat({
		sessionId,
		startedAt,
		sleep,
		summaries: () => engine.current?.summaries() ?? [],
		onEnded: () => void close("server"),
	})

	useEffect(() => {
		if (!startedAt) {
			return
		}

		let queue = queryClient
			.query({ ...wordQueryOptions(wordId), staleTime: 0 })
			.then((word) => {
				const created = createLearningEngine({
					wordId,
					recordingUrls: word.recordings.map((item) => item.url),
					startedAt: Date.parse(startedAt),
					sleep: { sleepAt: sleep.sleep_at, wakeAt: sleep.wake_at },
					onSound: (sound) => {
						const pending: Promise<unknown> = upload({
							sessionId,
							uri: sound.uri,
							capturedAt: sound.capturedAt,
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

				return created.start()
			})
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

		const run = (step: () => Promise<void> | undefined) => {
			queue = queue
				.then(step)
				.catch((error: unknown) => reportError(error, "learning_engine"))
		}

		const lifecycle = AppState.addEventListener("change", (state) => {
			run(() => (state === "active" ? engine.current?.resume() : engine.current?.pause()))
		})

		return () => {
			lifecycle.remove()

			run(() => {
				const current = engine.current

				engine.current = null

				return current?.stop()
			})
		}
	}, [endsAt, queryClient, sessionId, sleep, startedAt, upload, wordId])

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
		end: () => void close("user"),
	}
}
