import type { Phase } from '@/types/apis/sessions';

import { CLOCK_FORMAT, type SleepSettings } from '@/types/sleep-settings';

import dayjs, { type Dayjs } from 'dayjs';

import { PHASE_CYCLE } from '@/config/policy';
import { DAY, MINUTES_PER_HOUR } from '@/utils/units';

export interface PhaseSpan {
	phase: Phase;
	start: number;
	end: number;
}

/** 자정부터 지난 분 수 */
const _minuteOfDay = (time: Dayjs) => {
	return time.hour() * MINUTES_PER_HOUR + time.minute();
};

/** 시각이 수면 시간 안에 있는지 여부 */
const _isSleeping = (at: number, sleep: SleepSettings) => {
	const sleepMinute = _minuteOfDay(dayjs(sleep.sleep_at, CLOCK_FORMAT));
	const wakeMinute = _minuteOfDay(dayjs(sleep.wake_at, CLOCK_FORMAT));
	const minute = _minuteOfDay(dayjs(at));

	if (sleepMinute === wakeMinute) {
		return false;
	}

	return sleepMinute < wakeMinute
		? minute >= sleepMinute && minute < wakeMinute
		: minute >= sleepMinute || minute < wakeMinute;
};

/** 기준 시각 뒤에 처음 오는 그 시:분의 시각 */
const _nextTimeOfDay = (after: number, time: string) => {
	const clock = dayjs(time, CLOCK_FORMAT);
	const target = dayjs(after).hour(clock.hour()).minute(clock.minute()).startOf('minute');

	return (target.valueOf() <= after ? target.add(1, 'day') : target).valueOf();
};

/** 시작부터 끝까지 수면 시간과 학습 단계 순서로 나눈 구간 목록 */
const _phaseSpans = (start: number, end: number, sleep: SleepSettings) => {
	const spans: PhaseSpan[] = [];
	let at = start;

	while (at < end) {
		if (_isSleeping(at, sleep)) {
			const wake = Math.min(_nextTimeOfDay(at, sleep.wake_at), end);

			spans.push({ phase: 'sleeping', start: at, end: wake });
			at = wake;
			continue;
		}

		const awakeEnd = sleep.sleep_at === sleep.wake_at ? end : Math.min(_nextTimeOfDay(at, sleep.sleep_at), end);
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
};

/** 지금 시각이 속한 학습 단계 구간 */
export const currentSpan = (start: number, now: number, sleep: SleepSettings) => {
	const found = _phaseSpans(start, now + DAY, sleep).find((span) => span.start <= now && now < span.end);

	return found ?? { phase: 'learning', start: now, end: now + PHASE_CYCLE[0].durationMs };
};

/** 지금 학습 단계, 남은 시간, 진행 비율 */
export const runStatus = (startedAt: string, endsAt: number | null, sleep: SleepSettings, now: number) => {
	const started = dayjs(startedAt).valueOf();
	const span = currentSpan(started, now, sleep);

	if (endsAt === null) {
		return { phase: span.phase, remainingMs: null, progressRatio: null };
	}

	return {
		phase: span.phase,
		remainingMs: endsAt - now,
		progressRatio: (now - started) / (endsAt - started),
	};
};
