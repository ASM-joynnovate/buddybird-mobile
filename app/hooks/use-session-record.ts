import { useQuery } from "@tanstack/react-query"

import { SCREEN_REFRESH_MS } from "@/config"
import { sessionPlaysQueryOptions } from "@/hooks/apis/mocks"
import { sessionQueryOptions } from "@/hooks/apis/sessions"
import { settingsQueryOptions } from "@/hooks/apis/settings"
import { wordsQueryOptions } from "@/hooks/apis/words"
import { useSessionTimeline } from "@/hooks/use-session-timeline"
import type { SessionRecord, SessionTimeline } from "@/mocks/types"

export function useSessionRecord(sessionId: string): {
	record: SessionRecord | undefined
	timeline: SessionTimeline | undefined
	loadedAt: number
	isError: boolean
	retry(): void
} {
	const session = useQuery({
		...sessionQueryOptions(sessionId),
		refetchInterval: (query) =>
			query.state.data?.status === "running" ? SCREEN_REFRESH_MS : false,
	})

	const refetchInterval = session.data?.status === "running" ? SCREEN_REFRESH_MS : false

	const { timeline, ...timelineState } = useSessionTimeline(sessionId, refetchInterval)

	const plays = useQuery({ ...sessionPlaysQueryOptions(sessionId), refetchInterval })
	const settings = useQuery(settingsQueryOptions())
	const words = useQuery(wordsQueryOptions())

	const record =
		session.data && timeline && plays.data && settings.data
			? {
					session: session.data,
					wordName:
						words.data?.find((word) => word.id === session.data.word_id)?.name ?? null,
					sleep: settings.data.sleep,
					playCount: plays.data.play_count,
					mimicryCount: timeline.sounds.filter((sound) => sound.judgment?.word_id).length,
				}
			: undefined

	return {
		record,
		timeline,
		loadedAt: session.dataUpdatedAt,
		isError:
			session.isError ||
			timelineState.isError ||
			plays.isError ||
			settings.isError ||
			words.isError,
		retry: () => {
			void session.refetch()
			void plays.refetch()
			void settings.refetch()
			void words.refetch()
			timelineState.retry()
		},
	}
}
