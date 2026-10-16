import type { SessionEvent, SessionEventFile, SessionSound } from '@/types/apis/sessions';

import { CLOCK_FORMAT, type SleepSettings } from '@/types/sleep-settings';

import dayjs from 'dayjs';

import { HOUR } from '@/config/units';

export type LogItemKind = 'parrot' | 'mimic' | 'emergency' | 'parrotDisappeared' | 'parrotAppeared';

export interface TimeSpan {
	start: number;
	end: number;
}

export interface LogItem {
	id: string;
	kind: LogItemKind;
	startedAt: string;
	endedAt: string | null;
	sounds: SessionSound[];
	score: number | null;
	durationMs: number | null;
	file: SessionEventFile | null;
}

export interface LogRow extends TimeSpan {
	sleeping: boolean;
	items: LogItem[];
}

export interface LogDay {
	date: number;
	rows: LogRow[];
}

/** 소리의 녹음 시각을 비교하는 함수 */
const _compareCapturedAt = (a: SessionSound, b: SessionSound) => {
	return Date.parse(a.captured_at) - Date.parse(b.captured_at);
};

/** 다음 날 자정 시각을 반환하는 함수 */
const _nextMidnight = (time: number) => {
	return dayjs(time).add(1, 'day').startOf('day').valueOf();
};

/** 구간을 자정마다 나누는 함수 */
const _splitAtMidnight = ({ start, end }: TimeSpan) => {
	const spans: TimeSpan[] = [];

	for (let spanStart = start; spanStart < end; spanStart = _nextMidnight(spanStart)) {
		spans.push({ start: spanStart, end: Math.min(_nextMidnight(spanStart), end) });
	}

	return spans;
};

/** 구간을 한 시간마다 나누는 함수 */
const _hourRows = ({ start, end }: TimeSpan) => {
	const rows: LogRow[] = [];

	for (let hour = dayjs(start).startOf('hour').valueOf(); hour < end; hour += HOUR) {
		rows.push({
			start: Math.max(hour, start),
			end: Math.min(hour + HOUR, end),
			sleeping: false,
			items: [],
		});
	}

	return rows;
};

/** 수면 구간 목록을 반환하는 함수 */
export const getSleepSpans = ({ start, end }: TimeSpan, sleep: SleepSettings | null) => {
	if (!sleep || sleep.sleep_at === sleep.wake_at) {
		return [];
	}

	const sleepAt = dayjs(sleep.sleep_at, CLOCK_FORMAT);
	const wakeAt = dayjs(sleep.wake_at, CLOCK_FORMAT);
	const wakeDayOffset = sleep.wake_at > sleep.sleep_at ? 0 : 1;
	const spans: TimeSpan[] = [];

	for (let day = dayjs(start).startOf('day').subtract(1, 'day'); day.valueOf() < end; day = day.add(1, 'day')) {
		const sleepStart = day.hour(sleepAt.hour()).minute(sleepAt.minute()).second(sleepAt.second()).valueOf();
		const sleepEnd = day
			.add(wakeDayOffset, 'day')
			.hour(wakeAt.hour())
			.minute(wakeAt.minute())
			.second(wakeAt.second())
			.valueOf();
		const spanStart = Math.max(sleepStart, start);
		const spanEnd = Math.min(sleepEnd, end);

		if (spanStart < spanEnd) {
			spans.push({ start: spanStart, end: spanEnd });
		}
	}

	return spans;
};

/** 시각순 기록 목록을 반환하는 함수 */
export const getLogItems = (sounds: SessionSound[], events: SessionEvent[]) => {
	const emergencyEvents = events.filter((event) => event.kind === 'sound_emergency_detected');
	const emergencySoundIds = new Set(emergencyEvents.flatMap((event) => event.sound_ids));

	const soundItems = sounds
		.filter((sound) => !emergencySoundIds.has(sound.id))
		.map((sound): LogItem => {
			const mimicked = Boolean(sound.judgment?.word_id);

			return {
				id: sound.id,
				kind: mimicked ? 'mimic' : 'parrot',
				startedAt: sound.captured_at,
				endedAt: null,
				sounds: [sound],
				score: (mimicked ? sound.judgment?.score : sound.analysis?.score) ?? null,
				durationMs: sound.duration_ms ?? null,
				file: null,
			};
		});
	const emergencyItems = emergencyEvents.map((event): LogItem => ({
		id: event.id,
		kind: 'emergency',
		startedAt: event.occurred_at,
		endedAt: event.ended_at,
		sounds: sounds.filter((sound) => event.sound_ids.includes(sound.id)).sort(_compareCapturedAt),
		score: null,
		durationMs: event.ended_at ? Date.parse(event.ended_at) - Date.parse(event.occurred_at) : null,
		file: null,
	}));
	const petcamItems = events
		.filter((event) => event.kind === 'parrot_disappeared' || event.kind === 'parrot_appeared')
		.map((event): LogItem => {
			const disappeared = event.kind === 'parrot_disappeared';

			return {
				id: event.id,
				kind: disappeared ? 'parrotDisappeared' : 'parrotAppeared',
				startedAt: event.occurred_at,
				endedAt: event.ended_at,
				sounds: [],
				score: null,
				durationMs: null,
				file: disappeared ? event.video : event.image,
			};
		});

	return [...soundItems, ...emergencyItems, ...petcamItems].sort(
		(a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt),
	);
};

/** 날짜별 행에 기록을 담는 함수 */
export const getLogDays = (session: TimeSpan, sleepSpans: TimeSpan[], items: LogItem[]) => {
	const awakeSpans = [...sleepSpans, { start: session.end, end: session.end }].map((sleepSpan, index) => ({
		start: index === 0 ? session.start : sleepSpans[index - 1].end,
		end: sleepSpan.start,
	}));
	const rows = awakeSpans.flatMap((awakeSpan, index) => [
		..._splitAtMidnight(awakeSpan).flatMap(_hourRows),
		...(index < sleepSpans.length
			? _splitAtMidnight(sleepSpans[index]).map((sleepSpan): LogRow => ({
					...sleepSpan,
					sleeping: true,
					items: [],
				}))
			: []),
	]);

	// 세션 밖 시각의 소리는 가장 가까운 행에 둠
	const rowsWithItems = rows.map((row) => ({
		...row,
		items: items.filter((item) => {
			const at = Math.min(Math.max(Date.parse(item.startedAt), session.start), session.end - 1);

			return at >= row.start && at < row.end;
		}),
	}));
	const dates = [...new Set(rowsWithItems.map((row) => dayjs(row.start).startOf('day').valueOf()))];

	return dates.map((date): LogDay => ({
		date,
		rows: rowsWithItems.filter((row) => dayjs(row.start).startOf('day').valueOf() === date),
	}));
};
