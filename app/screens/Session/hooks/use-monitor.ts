import { useIsFocused } from "@react-navigation/native"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"

import { SCREEN_REFRESH_MS } from "@/config"
import { stationStatusQueryOptions } from "@/hooks/apis/mocks"
import {
	changeLearningMutationOptions,
	changeWordMutationOptions,
	finishSessionMutationOptions,
} from "@/hooks/apis/sessions"
import { useIdempotentMutation } from "@/hooks/apis/use-idempotent-mutation"
import { type RunningSessionDetail, useRunningSession } from "@/hooks/use-running-session"
import { useSessionTimeline } from "@/hooks/use-session-timeline"
import type { StationStatus, TimelineSound } from "@/mocks/types"
import { isDisconnected, useNow } from "@/screens/Session/hooks/use-clock"
import { SECOND } from "@/utils/units"

type ChangeField = "word" | "learning"

export type MonitorState = {
	detail: RunningSessionDetail | null
	stationStatus: StationStatus | null
	loading: boolean
	isError: boolean
	sounds: TimelineSound[]
	disconnected: boolean
	applying: ChangeField | null
	changeFailed: boolean
	changing: boolean
	finishing: boolean
	finishFailed: boolean
	retry(): void
	changeWord(wordId: string, onDone?: () => void): void
	changeLearning(enabled: boolean): void
	finish(): void
	resetFinish(): void
}

export function useMonitor(onEnded: (sessionId: string) => void): MonitorState {
	const focused = useIsFocused()
	const refetchInterval = focused ? SCREEN_REFRESH_MS : false

	const running = useRunningSession(refetchInterval)
	const session = running.detail?.session ?? null

	const stationStatus = useQuery({
		...stationStatusQueryOptions(session?.id ?? ""),
		enabled: session !== null,
		refetchInterval,
	})
	const { timeline } = useSessionTimeline(session?.id ?? null, refetchInterval)

	const wordChange = useIdempotentMutation(changeWordMutationOptions())
	const learningChange = useIdempotentMutation(changeLearningMutationOptions())
	const finishing = useIdempotentMutation(finishSessionMutationOptions())

	const now = useNow(focused, 5 * SECOND)

	const [lastField, setLastField] = useState<ChangeField | null>(null)

	const seen = useRef<string | null>(null)
	const ended = useRef(false)

	useEffect(() => {
		if (!running.isSuccess || ended.current) {
			return
		}

		if (running.sessionId && seen.current === null) {
			seen.current = running.sessionId
		}

		if (seen.current && running.sessionId !== seen.current) {
			ended.current = true

			onEnded(seen.current)
		}
	}, [running.sessionId, running.isSuccess, onEnded])

	const changing = wordChange.isPending || learningChange.isPending
	const pendingApply =
		session !== null && session.settings.applied_version < session.settings.version

	return {
		detail: running.detail,
		stationStatus: stationStatus.data ?? null,
		loading: running.loading,
		isError: running.isError,
		sounds: [...(timeline?.sounds ?? [])].sort(
			(a, b) => Date.parse(b.captured_at) - Date.parse(a.captured_at),
		),
		disconnected: session !== null && isDisconnected(session.progress.last_heartbeat_at, now),
		applying: changing || pendingApply ? lastField : null,
		changeFailed: wordChange.isError || learningChange.isError,
		changing,
		finishing: finishing.isPending,
		finishFailed: finishing.isError,
		retry: running.retry,
		changeWord: (wordId, onDone) => {
			if (!session) {
				return
			}

			setLastField("word")

			wordChange.mutate({ id: session.id, wordId }, { onSuccess: onDone })
		},
		changeLearning: (enabled) => {
			if (!session) {
				return
			}

			setLastField("learning")

			learningChange.mutate({ id: session.id, enabled })
		},
		finish: () => {
			if (session) {
				finishing.mutate({ id: session.id })
			}
		},
		resetFinish: () => finishing.reset(),
	}
}
