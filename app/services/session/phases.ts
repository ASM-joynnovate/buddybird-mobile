export type Phase = "learning" | "rest" | "stress_care" | "sleeping"

export type PhaseSpan = { phase: Phase; start: number; end: number }

export type SleepWindow = { sleepAt: string; wakeAt: string }

const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE

export const cycle: readonly { phase: Phase; ms: number }[] = [
	{ phase: "learning", ms: 10 * MINUTE },
	{ phase: "rest", ms: 5 * MINUTE },
	{ phase: "stress_care", ms: 5 * MINUTE },
]

export function minutesOf(time: string): number {
	const [hours, minutes] = time.split(":").map(Number)

	return hours * 60 + minutes
}

function minuteOfDay(at: number) {
	const date = new Date(at)

	return date.getHours() * 60 + date.getMinutes()
}

export function isSleeping(at: number, window: SleepWindow): boolean {
	const sleep = minutesOf(window.sleepAt)
	const wake = minutesOf(window.wakeAt)
	const minute = minuteOfDay(at)

	if (sleep === wake) {
		return false
	}

	return sleep < wake ? minute >= sleep && minute < wake : minute >= sleep || minute < wake
}

export function nextTimeOfDay(after: number, time: string): number {
	const date = new Date(after)
	const target = minutesOf(time)

	date.setHours(Math.floor(target / 60), target % 60, 0, 0)

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
			const spanEnd = Math.min(cursor + cycle[index].ms, awakeEnd)

			spans.push({ phase: cycle[index].phase, start: cursor, end: spanEnd })
			cursor = spanEnd
			index = (index + 1) % cycle.length
		}

		at = awakeEnd
	}

	return spans
}

export function currentSpan(start: number, now: number, window: SleepWindow): PhaseSpan {
	const found = phaseSpans(start, now + DAY, window).find(
		(span) => span.start <= now && now < span.end,
	)

	return found ?? { phase: "learning", start: now, end: now + cycle[0].ms }
}
