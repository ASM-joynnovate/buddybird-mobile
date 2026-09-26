import { useEffect, useRef } from "react"

import { HEARTBEAT_INTERVAL_MS } from "@/config"
import { heartbeatMutationOptions } from "@/hooks/apis/sessions"
import { useIdempotentMutation } from "@/hooks/apis/use-idempotent-mutation"
import { currentSpan } from "@/services/session/phases"
import { ApiError } from "@/types/apis/common"
import type { HeartbeatSummary } from "@/types/apis/sessions"
import type { SleepSettings } from "@/types/apis/settings"

type HeartbeatInput = {
	sessionId: string
	appliedVersion: number
	startedAt: string | null
	sleep: SleepSettings | null
	summaries(): HeartbeatSummary[]
	onEnded(): void
}

export function useHeartbeat({
	sessionId,
	appliedVersion,
	startedAt,
	sleep,
	summaries,
	onEnded,
}: HeartbeatInput): void {
	const { mutate } = useIdempotentMutation(heartbeatMutationOptions())

	const latest = useRef({ appliedVersion, startedAt, sleep, summaries, onEnded })

	useEffect(() => {
		latest.current = { appliedVersion, startedAt, sleep, summaries, onEnded }
	}, [appliedVersion, startedAt, sleep, summaries, onEnded])

	useEffect(() => {
		function beat() {
			const { startedAt: sessionStartedAt, sleep: sleepSettings } = latest.current
			const span =
				sessionStartedAt && sleepSettings
					? currentSpan(Date.parse(sessionStartedAt), Date.now(), {
							sleepAt: sleepSettings.sleep_at,
							wakeAt: sleepSettings.wake_at,
						})
					: null

			mutate(
				{
					id: sessionId,
					input: {
						current_phase: span?.phase ?? null,
						phase_started_at: span ? new Date(span.start).toISOString() : null,
						applied_settings_version: latest.current.appliedVersion,
						timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
						summaries: latest.current.summaries(),
					},
				},
				{
					onError: (error) => {
						if (error instanceof ApiError && error.code === "SESSION__NOT_RUNNING") {
							latest.current.onEnded()
						}
					},
				},
			)
		}

		beat()

		const timer = setInterval(beat, HEARTBEAT_INTERVAL_MS)

		return () => clearInterval(timer)
	}, [mutate, sessionId])
}
