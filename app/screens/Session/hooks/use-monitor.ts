import { useIsFocused } from "@react-navigation/native"
import { useMutation, useQuery } from "@tanstack/react-query"
import { randomUUID } from "expo-crypto"
import { useEffect, useRef, useState } from "react"

import type { RunningSession, SessionSettingsInput, Sound } from "@/apis/sessions"
import {
	finishSessionMutationOptions,
	runningSessionQueryOptions,
	timelineQueryOptions,
	updateSessionSettingsMutationOptions,
} from "@/hooks/apis/sessions"
import { isDisconnected, useNow } from "@/screens/Session/hooks/use-clock"

const REFRESH_MS = 10_000

type ChangeField = "word" | "learning"

export type MonitorState = {
	session: RunningSession | null
	loading: boolean
	isError: boolean
	sounds: Sound[]
	disconnected: boolean
	applying: ChangeField | null
	changeFailed: boolean
	changing: boolean
	finishing: boolean
	finishFailed: boolean
	retry(): void
	change(input: SessionSettingsInput, onDone?: () => void): void
	finish(): void
	resetFinish(): void
}

export function useMonitor(onEnded: (sessionId: string) => void): MonitorState {
	const focused = useIsFocused()
	const refetchInterval = focused ? REFRESH_MS : false
	const running = useQuery({ ...runningSessionQueryOptions(), refetchInterval })
	const session = running.data ?? null
	const timeline = useQuery({
		...timelineQueryOptions(session?.id ?? ""),
		enabled: session !== null,
		refetchInterval,
	})
	const settings = useMutation(updateSessionSettingsMutationOptions())
	const finishing = useMutation(finishSessionMutationOptions())
	const [lastField, setLastField] = useState<ChangeField | null>(null)
	const seen = useRef<string | null>(null)
	const ended = useRef(false)
	const now = useNow(focused, 5000)

	useEffect(() => {
		if (!running.isSuccess || ended.current) {
			return
		}

		if (running.data && seen.current === null) {
			seen.current = running.data.id
		}

		if (seen.current && running.data?.id !== seen.current) {
			ended.current = true
			onEnded(seen.current)
		}
	}, [running.data, running.isSuccess, onEnded])

	const pendingApply =
		session !== null && session.applied_settings_version < session.settings_version

	return {
		session,
		loading: running.isPending,
		isError: running.isError,
		sounds: [...(timeline.data?.sounds ?? [])].sort(
			(a, b) => Date.parse(b.captured_at) - Date.parse(a.captured_at),
		),
		disconnected: session !== null && isDisconnected(session.last_heartbeat_at, now),
		applying: settings.isPending || pendingApply ? lastField : null,
		changeFailed: settings.isError,
		changing: settings.isPending,
		finishing: finishing.isPending,
		finishFailed: finishing.isError,
		retry: () => void running.refetch(),
		change: (input, onDone) => {
			if (!session) {
				return
			}

			setLastField(input.word_id ? "word" : "learning")
			settings.mutate(
				{ id: session.id, input, idempotencyKey: randomUUID() },
				{ onSuccess: onDone },
			)
		},
		finish: () => {
			if (session) {
				finishing.mutate({ id: session.id, idempotencyKey: randomUUID() })
			}
		},
		resetFinish: () => finishing.reset(),
	}
}
