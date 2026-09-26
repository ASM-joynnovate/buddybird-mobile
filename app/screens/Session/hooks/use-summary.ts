import { useQuery } from "@tanstack/react-query"

import { parrotsQueryOptions } from "@/hooks/apis/parrots"
import { useSessionRecord } from "@/hooks/use-session-record"
import type { SessionRecord, SessionTimeline, TimelineSound } from "@/mocks/types"

export type StripData = {
	start: number
	end: number
	activity: { at: number; level: number }[]
	sounds: { id: string; at: number; mimicked: boolean }[]
}

export type SummaryData = {
	record: SessionRecord
	timeline: SessionTimeline
	parrotName: string | null
	strip: StripData
	best: TimelineSound | null
	analyzing: boolean
}

function bestMimicry(sounds: readonly TimelineSound[]): TimelineSound | null {
	return sounds.reduce<TimelineSound | null>((best, sound) => {
		const score = sound.analysis?.score

		if (!sound.judgment?.word_id || score == null) {
			return best
		}

		return !best || score > (best.analysis?.score ?? 0) ? sound : best
	}, null)
}

function summarize(
	record: SessionRecord,
	timeline: SessionTimeline,
	parrotName: string | null,
): SummaryData {
	const { session } = record

	return {
		record,
		timeline,
		parrotName,
		best: bestMimicry(timeline.sounds),
		analyzing: timeline.sounds.some((sound) => sound.judgment === null),
		strip: {
			start: Date.parse(session.period.started_at),
			end: session.period.ended_at ? Date.parse(session.period.ended_at) : Date.now(),
			activity: timeline.activity.map((item) => ({
				at: Date.parse(item.at),
				level: item.level,
			})),
			sounds: timeline.sounds.map((sound) => ({
				id: sound.id,
				at: Date.parse(sound.captured_at),
				mimicked: Boolean(sound.judgment?.word_id),
			})),
		},
	}
}

export function useSummary(sessionId: string): {
	data: SummaryData | null
	isError: boolean
	retry(): void
} {
	const { record, timeline, isError, retry } = useSessionRecord(sessionId)
	const parrots = useQuery(parrotsQueryOptions())
	const data =
		record && timeline ? summarize(record, timeline, parrots.data?.[0]?.name ?? null) : null

	return { data, isError, retry }
}
