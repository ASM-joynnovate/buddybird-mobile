import type { Phase } from '@/types/apis/sessions';

import { CLOCK_FORMAT, type SleepSettings } from '@/types/sleep-settings';

import dayjs, { type Dayjs } from 'dayjs';

import { CYCLE } from '@/config/policy';
import { DAY, MINUTES_PER_HOUR } from '@/utils/units';

export type PhaseSpan = { phase: Phase; start: number; end: number };

function minuteOfDay(moment: Dayjs): number {
	return moment.hour() * MINUTES_PER_HOUR + moment.minute();
}

function isSleeping(at: number, sleep: SleepSettings): boolean {
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

function phaseSpans(start: number, end: number, sleep: SleepSettings): PhaseSpan[] {
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
			const spanEnd = Math.min(cursor + CYCLE[index].ms, awakeEnd);

			spans.push({ phase: CYCLE[index].phase, start: cursor, end: spanEnd });
			cursor = spanEnd;
			index = (index + 1) % CYCLE.length;
		}

		at = awakeEnd;
	}

	return spans;
}

export function currentSpan(start: number, now: number, sleep: SleepSettings): PhaseSpan {
	const found = phaseSpans(start, now + DAY, sleep).find((span) => span.start <= now && now < span.end);

	return found ?? { phase: 'learning', start: now, end: now + CYCLE[0].ms };
}

type RunStatus = { phase: Phase; remainingMs: number | null; fraction: number | null };

export function runStatus(startedAt: string, endsAt: number | null, sleep: SleepSettings, now: number): RunStatus {
	const started = Date.parse(startedAt);
	const span = currentSpan(started, now, sleep);

	if (endsAt === null) {
		return { phase: span.phase, remainingMs: null, fraction: null };
	}

	return {
		phase: span.phase,
		remainingMs: endsAt - now,
		fraction: (now - started) / (endsAt - started),
	};
}
