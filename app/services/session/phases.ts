import { CYCLE } from "@/config"
import { DAY, MINUTES_PER_HOUR } from "@/utils/units"

export type Phase = "learning" | "rest" | "stress_care" | "sleeping"

export type PhaseSpan = { phase: Phase; start: number; end: number }

export type SleepWindow = { sleepAt: string; wakeAt: string }

function minutesOf(time: string): number {
	const [hours, minutes] = time.split(":").map(Number)

	return hours * MINUTES_PER_HOUR + minutes
}

function minuteOfDay(at: number) {
	const date = new Date(at)

	return date.getHours() * MINUTES_PER_HOUR + date.getMinutes()
}

function isSleeping(at: number, window: SleepWindow): boolean {
	const sleep = minutesOf(window.sleepAt)
	const wake = minutesOf(window.wakeAt)
	const minute = minuteOfDay(at)

	if (sleep === wake) {
		return false
	}

	return sleep < wake ? minute >= sleep && minute < wake : minute >= sleep || minute < wake
}

function nextTimeOfDay(after: number, time: string): number {
	const date = new Date(after)
	const target = minutesOf(time)

	date.setHours(Math.floor(target / MINUTES_PER_HOUR), target % MINUTES_PER_HOUR, 0, 0)

	if (date.getTime() <= after) {
		date.setDate(date.getDate() + 1)
	}

	return date.getTime()
}

export function phaseSpans(start: number, end: number, window: SleepWindow): PhaseSpan[] {
	const spans: PhaseSpan[] = []
	let at = start

	while (at < end) {
		if (isSleeping(at, window)) {
			const wake = Math.min(nextTimeOfDay(at, window.wakeAt), end)

			spans.push({ phase: "sleeping", start: at, end: wake })
			at = wake
			continue
		}

		const awakeEnd =
			window.sleepAt === window.wakeAt
				? end
				: Math.min(nextTimeOfDay(at, window.sleepAt), end)
		let cursor = at
		let index = 0

		while (cursor < awakeEnd) {
			const spanEnd = Math.min(cursor + CYCLE[index].ms, awakeEnd)

			spans.push({ phase: CYCLE[index].phase, start: cursor, end: spanEnd })
			cursor = spanEnd
			index = (index + 1) % CYCLE.length
		}

		at = awakeEnd
	}

	return spans
}

export function currentSpan(start: number, now: number, window: SleepWindow): PhaseSpan {
	const found = phaseSpans(start, now + DAY, window).find(
		(span) => span.start <= now && now < span.end,
	)

	return found ?? { phase: "learning", start: now, end: now + CYCLE[0].ms }
}
