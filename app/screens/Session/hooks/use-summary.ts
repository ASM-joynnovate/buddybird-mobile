import { useQuery } from "@tanstack/react-query"

import type { EmergencyBrief } from "@/apis/emergencies"
import type { Session, Sound, Timeline } from "@/apis/sessions"
import { parrotsQueryOptions } from "@/hooks/apis/parrots"
import { sessionQueryOptions, timelineQueryOptions } from "@/hooks/apis/sessions"

export type StripData = {
	start: number
	end: number
	activity: { at: number; level: number }[]
	sounds: { id: string; at: number; mimicked: boolean }[]
	emergencies: { id: string; at: number }[]
}

export type SummaryData = {
	session: Session
	timeline: Timeline
	parrotName: string | null
	strip: StripData
	emergencies: EmergencyBrief[]
	best: Sound | null
	analyzing: boolean
}

function bestMimicry(sounds: readonly Sound[]): Sound | null {
	return sounds.reduce<Sound | null>((best, sound) => {
		if (!sound.judgment || !sound.audio_url) {
			return best
		}

		return !best?.judgment || sound.judgment.score > best.judgment.score ? sound : best
	}, null)
}

function summarize(session: Session, timeline: Timeline, parrotName: string | null): SummaryData {
	const emergencies = timeline.events.flatMap((event) =>
		event.kind === "emergency_detected" && event.emergency ? [event.emergency] : [],
	)

	return {
		session,
		timeline,
		parrotName,
		emergencies,
		best: bestMimicry(timeline.sounds),
		analyzing: timeline.sounds.some((sound) => sound.is_parrot_sound === null),
		strip: {
			start: Date.parse(session.started_at),
			end: session.ended_at ? Date.parse(session.ended_at) : Date.now(),
			activity: timeline.activity.map((item) => ({
				at: Date.parse(item.at),
				level: item.level,
			})),
			sounds: timeline.sounds.map((sound) => ({
				id: sound.id,
				at: Date.parse(sound.captured_at),
				mimicked: sound.judgment !== null,
			})),
			emergencies: emergencies.map((item) => ({
				id: item.id,
				at: Date.parse(item.detected_at),
			})),
		},
	}
}

export function useSummary(sessionId: string): {
	data: SummaryData | null
	isError: boolean
	retry(): void
} {
	const session = useQuery(sessionQueryOptions(sessionId))
	const timeline = useQuery(timelineQueryOptions(sessionId))
	const parrots = useQuery(parrotsQueryOptions())
	const data =
		session.data && timeline.data
			? summarize(session.data, timeline.data, parrots.data?.[0]?.name ?? null)
			: null

	return {
		data,
		isError: session.isError || timeline.isError,
		retry: () => {
			void session.refetch()
			void timeline.refetch()
		},
	}
}
