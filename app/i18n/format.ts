import type { Locale } from '@/types/locale';
import { CLOCK_FORMAT } from '@/types/sleep-settings';

import { durationText } from '@/i18n/duration';

import dayjs, { type Dayjs } from 'dayjs';

type Moment = string | number | Dayjs;

const dateFormats: Record<Locale, { monthDay: string; monthDayWeekday: string; yearMonth: string }> = {
	'ko-KR': { monthDay: 'MMMM D일', monthDayWeekday: 'MMMM D일 (ddd)', yearMonth: 'YYYY년 MMMM' },
	'en-US': { monthDay: 'MMMM D', monthDayWeekday: 'ddd, MMMM D', yearMonth: 'MMMM YYYY' },
};

export function formatDate(value: Moment, locale: Locale): string {
	return dayjs(value).format(dateFormats[locale].monthDay);
}

export function formatDateWithWeekday(value: Moment, locale: Locale): string {
	return dayjs(value).format(dateFormats[locale].monthDayWeekday);
}

export function formatMonth(value: Moment, locale: Locale): string {
	return dayjs(value).format(dateFormats[locale].yearMonth);
}

export function formatDateTime(value: Moment, locale: Locale): string {
	return `${formatDate(value, locale)} ${dayjs(value).format('LT')}`;
}

export function formatMoment(value: Moment, locale: Locale, now: Moment = dayjs()): string {
	const moment = dayjs(value);

	return moment.isSame(now, 'day') ? moment.format('LT') : formatDateTime(value, locale);
}

/** 1분 미만은 초를 반올림하고 1분 이상은 분 아래를 버린 시간 길이 문구 */
export const formatDuration = (ms: number, locale: Locale) => {
	const duration = dayjs.duration(Math.max(0, ms));

	return duration.asMinutes() < 1
		? durationText(dayjs.duration(Math.round(duration.asSeconds()), 'seconds'), locale)
		: durationText(dayjs.duration(Math.floor(duration.asMinutes()), 'minutes'), locale);
};

export function formatDurationWithDays(ms: number, locale: Locale): string {
	const duration = dayjs.duration(ms);
	const days = Math.floor(duration.asDays());
	const remainderMs = duration.subtract(days, 'day').asMilliseconds();

	if (days === 0) {
		return formatDuration(ms, locale);
	}

	const dayText = `${days}${locale === 'ko-KR' ? '일' : 'd'}`;

	return remainderMs === 0 ? dayText : `${dayText} ${formatDuration(remainderMs, locale)}`;
}

/** 시:분:초나 분:초 모양의 시계 문구 */
export const formatTimer = (ms: number) => {
	const duration = dayjs.duration(Math.max(0, ms));
	const hours = Math.floor(duration.asHours());

	return hours > 0 ? `${hours}:${duration.format('mm:ss')}` : duration.format('m:ss');
};

export function formatClock(time: string): string {
	return dayjs(time, CLOCK_FORMAT).format('LT');
}
