import type { Locale } from '@/types/locale';
import { CLOCK_FORMAT } from '@/types/sleep-settings';

import { durationText } from '@/i18n/duration';

import dayjs from 'dayjs';

type Moment = string | number | Date;

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

export function formatMoment(value: Moment, locale: Locale, now: Moment = new Date()): string {
	const moment = dayjs(value);

	return moment.isSame(now, 'day') ? moment.format('LT') : formatDateTime(value, locale);
}

export function formatDuration(ms: number, locale: Locale): string {
	const minutes = Math.max(0, Math.floor(ms / 60_000));

	return minutes < 1 ? durationText(Math.round(ms / 1000), locale) : durationText(minutes * 60, locale);
}

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

export function formatTimer(ms: number): string {
	const total = Math.max(0, Math.floor(ms / 1000));
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const seconds = total % 60;

	const pad = (value: number) => String(value).padStart(2, '0');

	return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

export function formatClock(time: string): string {
	return dayjs(time, CLOCK_FORMAT).format('LT');
}
