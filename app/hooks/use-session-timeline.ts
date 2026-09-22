import { useQuery } from "@tanstack/react-query"

import { activityQueryOptions, eventExtrasQueryOptions } from "@/hooks/apis/mocks"
import { sessionEventsQueryOptions, sessionSoundsQueryOptions } from "@/hooks/apis/sessions"
import { wordsQueryOptions } from "@/hooks/apis/words"
import { useSoundsWithAnalysis } from "@/hooks/use-sounds-with-analysis"
import type { EventExtras, SessionTimeline, TimelineEvent } from "@/mocks/types"
import type { SessionEvent } from "@/types/apis/sessions"
import type { Word } from "@/types/apis/words"

function findWordRef(words: readonly Word[], wordId: string | null | undefined) {
	const word = words.find((item) => item.id === wordId)

	return word ? { id: word.id, name: word.name } : null
}

function timelineEvents(
	events: readonly SessionEvent[],
	eventDetails: EventExtras,
	words: readonly Word[],
): TimelineEvent[] {
	const serverEvents = events.map((event): TimelineEvent => {
		const detail = eventDetails.event_details.find((item) => item.event_id === event.id)

		return {
			id: event.id,
			kind: event.kind,
			occurred_at: event.occurred_at,
			word: findWordRef(words, event.word?.id),
			learning_enabled: detail?.learning_enabled ?? null,
			emergency: detail?.emergency ?? null,
		}
	})
	const sleepEvents = eventDetails.sleep_events.map((event): TimelineEvent => ({
		...event,
		word: null,
		learning_enabled: null,
		emergency: null,
	}))

	return [...serverEvents, ...sleepEvents].sort(
		(a, b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at),
	)
}

export function useSessionTimeline(
	sessionId: string | null,
	refetchInterval: number | false = false,
): {
	timeline: SessionTimeline | undefined
	isError: boolean
	retry(): void
} {
	const id = sessionId ?? ""
	const enabled = sessionId !== null

	const events = useQuery({ ...sessionEventsQueryOptions(id), enabled, refetchInterval })
	const sounds = useQuery({ ...sessionSoundsQueryOptions(id), enabled, refetchInterval })

	const eventDetails = useQuery({ ...eventExtrasQueryOptions(id), enabled, refetchInterval })
	const activity = useQuery({ ...activityQueryOptions(id), enabled, refetchInterval })
	const words = useQuery(wordsQueryOptions())
	const soundsWithAnalysis = useSoundsWithAnalysis(sounds.data, refetchInterval)

	const queries = [events, sounds, eventDetails, activity, words]
	const timeline =
		events.data &&
		eventDetails.data &&
		activity.data &&
		words.data &&
		soundsWithAnalysis.soundsWithAnalysis
			? {
					events: timelineEvents(events.data, eventDetails.data, words.data),
					sounds: soundsWithAnalysis.soundsWithAnalysis,
					activity: activity.data,
				}
			: undefined

	return {
		timeline,
		isError: queries.some((query) => query.isError) || soundsWithAnalysis.isError,
		retry: () => {
			for (const query of queries) {
				void query.refetch()
			}

			soundsWithAnalysis.retry()
		},
	}
}
