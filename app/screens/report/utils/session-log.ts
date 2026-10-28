import type {
	SessionEventFile,
	SessionLogItem,
	SessionLogKind,
	SessionLogSound,
	SessionUserReview,
} from '@/types/apis/sessions';

import type { LogFilter, LogItemKind } from '@/types/session-log';
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
	sounds: Pick<SessionLogSound, 'audio_file'>[];
	score: number | null;
	durationMs: number | null;
	file: SessionEventFile | null;
	userReview: SessionUserReview | null;
	isFeedShared: boolean;
}

export interface LogRow extends TimeSpan {
	isDuringSleep: boolean;
	logItems: LogItem[];
}

export const logFilterKinds: Record<LogFilter, SessionLogKind[]> = {
	all: ['parrot', 'mimic', 'distress_call_detected', 'parrot_disappeared', 'parrot_appeared'],
	sound: ['parrot'],
	word: ['mimic'],
	emergency: ['distress_call_detected', 'parrot_disappeared', 'parrot_appeared'],
};

/** 다음 날 자정 시각을 반환하는 함수 */
const nextMidnight = (time: number) => {
	return dayjs(time).add(1, 'day').startOf('day').valueOf();
};

/** 구간을 자정마다 나누는 함수 */
const splitAtMidnight = ({ start, end }: TimeSpan) => {
	const spans: TimeSpan[] = [];

	for (let spanStart = start; spanStart < end; spanStart = nextMidnight(spanStart)) {
		spans.push({ start: spanStart, end: Math.min(nextMidnight(spanStart), end) });
	}

	return spans;
};

/** 구간을 한 시간마다 나누는 함수 */
const hourRows = ({ start, end }: TimeSpan) => {
	const logRows: LogRow[] = [];

	for (let hour = dayjs(start).startOf('hour').valueOf(); hour < end; hour += HOUR) {
		logRows.push({
			start: Math.max(hour, start),
			end: Math.min(hour + HOUR, end),
			isDuringSleep: false,
			logItems: [],
		});
	}

	return logRows;
};

/** 수면 구간이 아닌 빈 행인지 확인하는 함수 */
const isEmptyLogRow = (logRow: LogRow) => {
	return logRow.logItems.length === 0 && !logRow.isDuringSleep;
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

/** 서버 기록 항목을 화면 기록으로 변환하는 함수 */
export const toLogItem = (sessionLogItem: SessionLogItem): LogItem => {
	const baseLogItem = {
		id: sessionLogItem.id,
		startedAt: sessionLogItem.occurred_at,
		endedAt: null,
		sounds: [],
		score: null,
		durationMs: null,
		file: null,
		userReview: sessionLogItem.user_review,
		isFeedShared: false,
	};

	switch (sessionLogItem.kind) {
		case 'parrot':
		case 'mimic':
			return {
				...baseLogItem,
				kind: sessionLogItem.kind,
				sounds: [{ audio_file: sessionLogItem.audio_file }],
				score: sessionLogItem.score,
				durationMs: sessionLogItem.duration_ms,
				isFeedShared: sessionLogItem.kind === 'mimic' && sessionLogItem.is_feed_shared,
			};
		case 'distress_call_detected':
			return {
				...baseLogItem,
				kind: 'distressCall',
				endedAt: sessionLogItem.ended_at,
				sounds: sessionLogItem.sounds,
				durationMs: sessionLogItem.ended_at
					? dayjs(sessionLogItem.ended_at).diff(sessionLogItem.occurred_at)
					: null,
			};
		case 'parrot_disappeared':
			return {
				...baseLogItem,
				kind: 'parrotDisappeared',
				endedAt: sessionLogItem.ended_at,
				file: sessionLogItem.video,
			};
		case 'parrot_appeared':
			return { ...baseLogItem, kind: 'parrotAppeared', file: sessionLogItem.image };
	}
};

/** 날짜별 행에 기록을 담는 함수 */
export const getLogDays = (sessionSpan: TimeSpan, sleepSpans: TimeSpan[], logItems: LogItem[]) => {
	const awakeSpans = [...sleepSpans, { start: sessionSpan.end, end: sessionSpan.end }].map((sleepSpan, index) => ({
		start: index === 0 ? sessionSpan.start : sleepSpans[index - 1].end,
		end: sleepSpan.start,
	}));
	const logRows = awakeSpans.flatMap((awakeSpan, index) => [
		...splitAtMidnight(awakeSpan).flatMap(hourRows),
		...(index < sleepSpans.length
			? splitAtMidnight(sleepSpans[index]).map((sleepSpan) => ({
					...sleepSpan,
					isDuringSleep: true,
					logItems: [],
				}))
			: []),
	]);

	// 세션 밖 시각의 소리는 가장 가까운 행에 둠
	const logRowsWithItems = logRows.map((logRow) => ({
		...logRow,
		logItems: logItems.filter((logItem) => {
			const itemTime = Math.min(
				Math.max(dayjs(logItem.startedAt).valueOf(), sessionSpan.start),
				sessionSpan.end - 1,
			);

			return itemTime >= logRow.start && itemTime < logRow.end;
		}),
	}));
	const dates = [...new Set(logRowsWithItems.map((logRow) => dayjs(logRow.start).startOf('day').valueOf()))];

	return dates.map((date) => ({
		date,
		logRows: logRowsWithItems.filter((logRow) => dayjs(logRow.start).startOf('day').valueOf() === date),
	}));
};

/** 기록 없는 연속 행을 하나로 합치는 함수 */
export const mergeEmptyLogRows = (logRows: LogRow[]) => {
	const mergedRows: LogRow[] = [];

	for (const logRow of logRows) {
		const lastRow = mergedRows.at(-1);

		if (lastRow && isEmptyLogRow(lastRow) && isEmptyLogRow(logRow)) {
			mergedRows[mergedRows.length - 1] = { ...lastRow, end: logRow.end };
		} else {
			mergedRows.push(logRow);
		}
	}

	return mergedRows;
};

/** 공유할 기록 파일의 이름을 반환하는 함수 */
export const sharedLogFileName = (startedAt: string) => {
	return `buddybird-${dayjs(startedAt).format('YYYYMMDD-HHmmss')}`;
};
