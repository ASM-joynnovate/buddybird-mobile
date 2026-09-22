import { useMutation } from "@tanstack/react-query"
import { randomUUID } from "expo-crypto"
import { useCallback, useEffect, useRef, useState } from "react"

import { heartbeatMutationOptions } from "@/hooks/apis/sessions"
import { currentSpan } from "@/services/session/phases"
import { ApiError } from "@/types/apis/common"
import type { SleepSettings } from "@/types/apis/settings"

const HEARTBEAT_MS = 10_000
const IDLE_MS = 5000

type HeartbeatInput = {
	sessionId: string
	appliedVersion: number
	startedAt: string | null
	sleep: SleepSettings | null
	onEnded(): void
}

export function useHeartbeat({
	sessionId,
	appliedVersion,
	startedAt,
	sleep,
	onEnded,
}: HeartbeatInput): void {
	const { mutate } = useMutation(heartbeatMutationOptions())
	const latest = useRef({ appliedVersion, startedAt, sleep, onEnded })

	useEffect(() => {
		latest.current = { appliedVersion, startedAt, sleep, onEnded }
	}, [appliedVersion, startedAt, sleep, onEnded])

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
						summaries: [],
					},
					idempotencyKey: randomUUID(),
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

		const timer = setInterval(beat, HEARTBEAT_MS)

		return () => clearInterval(timer)
	}, [mutate, sessionId])
}

export function useIdleReveal(): { visible: boolean; reveal(): void } {
	const [visible, setVisible] = useState(false)
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

	const reveal = useCallback(() => {
		setVisible(true)

		if (timer.current) {
			clearTimeout(timer.current)
		}

		timer.current = setTimeout(() => setVisible(false), IDLE_MS)
	}, [])

	useEffect(
		() => () => {
			if (timer.current) {
				clearTimeout(timer.current)
			}
		},
		[],
	)

	return { visible, reveal }
}
