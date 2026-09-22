import { useMutation } from "@tanstack/react-query"
import { randomUUID } from "expo-crypto"
import { useCallback, useEffect, useRef, useState } from "react"

import { heartbeatMutationOptions } from "@/hooks/apis/sessions"
import { ApiError } from "@/lib/api"

const HEARTBEAT_MS = 10_000
const IDLE_MS = 5000

type HeartbeatInput = {
	sessionId: string
	appliedVersion: number
	cameraAvailable: boolean
	onEnded(): void
}

export function useHeartbeat({
	sessionId,
	appliedVersion,
	cameraAvailable,
	onEnded,
}: HeartbeatInput): void {
	const { mutate } = useMutation(heartbeatMutationOptions())
	const latest = useRef({ appliedVersion, cameraAvailable, onEnded })

	useEffect(() => {
		latest.current = { appliedVersion, cameraAvailable, onEnded }
	}, [appliedVersion, cameraAvailable, onEnded])

	useEffect(() => {
		function beat() {
			mutate(
				{
					id: sessionId,
					input: {
						applied_settings_version: latest.current.appliedVersion,
						battery_level: null,
						is_charging: null,
						camera_available: latest.current.cameraAvailable,
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
