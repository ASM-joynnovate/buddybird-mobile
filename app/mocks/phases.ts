import type { Phase } from '@/types/apis/sessions';

import dayjs, { type Dayjs } from 'dayjs';

import { PHASE_CYCLE } from '@/config/policy';
import { DAY, MINUTES_PER_HOUR } from '@/utils/units';

type Sleep = { sleep_at: string; wake_at: string };

export type PhaseSpan = { phase: Phase; start: number; end: number };

const CLOCK_FORMAT = 'HH:mm:ss';

function minuteOfDay(moment: Dayjs): number {
	return moment.hour() * MINUTES_PER_HOUR + moment.minute();
}

function isSleeping(at: number, sleep: Sleep): boolean {
	const sleepMinute = minuteOfDay(dayjs(sleep.sleep_at, CLOCK_FORMAT));
	const wakeMinute = minuteOfDay(dayjs(sleep.wake_at, CLOCK_FORMAT));
	const minute = minuteOfDay(dayjs(at));

	if (sleepMinute === wakeMinute) {
		return false;
	}

	return sleepMinute < wakeMinute
		? minute >= sleepMinute && minute < wakeMinute
		: minute >= sleepMinute || minute < wakeMinute;
}

function nextTimeOfDay(after: number, time: string): number {
	const clock = dayjs(time, CLOCK_FORMAT);
	const target = dayjs(after).hour(clock.hour()).minute(clock.minute()).startOf('minute');

	return (target.valueOf() <= after ? target.add(1, 'day') : target).valueOf();
}

export function phaseSpans(start: number, end: number, sleep: Sleep): PhaseSpan[] {
	const spans: PhaseSpan[] = [];
	let at = start;

	while (at < end) {
		if (isSleeping(at, sleep)) {
			const wake = Math.min(nextTimeOfDay(at, sleep.wake_at), end);

			spans.push({ phase: 'sleeping', start: at, end: wake });
			at = wake;
			continue;
		}

		const awakeEnd = sleep.sleep_at === sleep.wake_at ? end : Math.min(nextTimeOfDay(at, sleep.sleep_at), end);
		let cursor = at;
		let index = 0;

		while (cursor < awakeEnd) {
			const spanEnd = Math.min(cursor + PHASE_CYCLE[index].durationMs, awakeEnd);

			spans.push({ phase: PHASE_CYCLE[index].phase, start: cursor, end: spanEnd });
			cursor = spanEnd;
			index = (index + 1) % PHASE_CYCLE.length;
		}

		at = awakeEnd;
	}

	return spans;
}

export function currentSpan(start: number, now: number, sleep: Sleep): PhaseSpan {
	const found = phaseSpans(start, now + DAY, sleep).find((span) => span.start <= now && now < span.end);

	return found ?? { phase: 'learning', start: now, end: now + PHASE_CYCLE[0].durationMs };
}
