import type { SessionEvent, SessionEventFile, SessionSound } from '@/types/apis/sessions';

import type { LogItemKind } from '@/types/session-log';
import { CLOCK_FORMAT, type SleepSettings } from '@/types/sleep-settings';

import dayjs from 'dayjs';

import { HOUR } from '@/config/units';

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
	duringSleep: boolean;
	logItems: LogItem[];
}

/** 소리의 녹음 시각을 비교하는 함수 */
const _compareCapturedAt = (a: SessionSound, b: SessionSound) => {
	return dayjs(a.captured_at).diff(b.captured_at);
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
	const logRows: LogRow[] = [];

	for (let hour = dayjs(start).startOf('hour').valueOf(); hour < end; hour += HOUR) {
		logRows.push({
			start: Math.max(hour, start),
			end: Math.min(hour + HOUR, end),
			duringSleep: false,
			logItems: [],
		});
	}

	return logRows;
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
	const distressCallEvents = events.filter((event) => event.kind === 'distress_call_detected');
	const distressCallSoundIds = new Set(distressCallEvents.flatMap((event) => event.sound_ids));

	const soundItems = sounds
		.filter((sound) => !distressCallSoundIds.has(sound.id))
		.map((sound): LogItem => {
			const soundMimicked = Boolean(sound.judgment?.word_id);

			return {
				id: sound.id,
				kind: soundMimicked ? 'mimic' : 'parrot',
				startedAt: sound.captured_at,
				endedAt: null,
				sounds: [sound],
				score: (soundMimicked ? sound.judgment?.score : sound.analysis?.score) ?? null,
				durationMs: sound.duration_ms ?? null,
				file: null,
			};
		});
	const distressCallItems = distressCallEvents.map((event): LogItem => ({
		id: event.id,
		kind: 'distressCall',
		startedAt: event.occurred_at,
		endedAt: event.ended_at,
		sounds: sounds.filter((sound) => event.sound_ids.includes(sound.id)).sort(_compareCapturedAt),
		score: null,
		durationMs: event.ended_at ? dayjs(event.ended_at).diff(event.occurred_at) : null,
		file: null,
	}));
	const petcamItems = events
		.filter((event) => event.kind === 'parrot_disappeared' || event.kind === 'parrot_appeared')
		.map((event): LogItem => {
			const parrotDisappeared = event.kind === 'parrot_disappeared';

			return {
				id: event.id,
				kind: parrotDisappeared ? 'parrotDisappeared' : 'parrotAppeared',
				startedAt: event.occurred_at,
				endedAt: event.ended_at,
				sounds: [],
				score: null,
				durationMs: null,
				file: parrotDisappeared ? event.video : event.image,
			};
		});

	return [...soundItems, ...distressCallItems, ...petcamItems].sort((a, b) => dayjs(a.startedAt).diff(b.startedAt));
};

/** 날짜별 행에 기록을 담는 함수 */
export const getLogDays = (session: TimeSpan, sleepSpans: TimeSpan[], logItems: LogItem[]) => {
	const awakeSpans = [...sleepSpans, { start: session.end, end: session.end }].map((sleepSpan, index) => ({
		start: index === 0 ? session.start : sleepSpans[index - 1].end,
		end: sleepSpan.start,
	}));
	const logRows = awakeSpans.flatMap((awakeSpan, index) => [
		..._splitAtMidnight(awakeSpan).flatMap(_hourRows),
		...(index < sleepSpans.length
			? _splitAtMidnight(sleepSpans[index]).map((sleepSpan) => ({
					...sleepSpan,
					duringSleep: true,
					logItems: [],
				}))
			: []),
	]);

	// 세션 밖 시각의 소리는 가장 가까운 행에 둠
	const rowsWithItems = logRows.map((row) => ({
		...row,
		logItems: logItems.filter((item) => {
			const at = Math.min(Math.max(dayjs(item.startedAt).valueOf(), session.start), session.end - 1);

			return at >= row.start && at < row.end;
		}),
	}));
	const dates = [...new Set(rowsWithItems.map((row) => dayjs(row.start).startOf('day').valueOf()))];

	return dates.map((date) => ({
		date,
		logRows: rowsWithItems.filter((row) => dayjs(row.start).startOf('day').valueOf() === date),
	}));
};

/** 공유할 기록 파일의 이름을 반환하는 함수 */
export const sharedLogFileName = (startedAt: string) => {
	return `buddybird-${dayjs(startedAt).format('YYYYMMDD-HHmmss')}`;
};
