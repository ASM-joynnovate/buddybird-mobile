import type { Locale } from '@/types/locale';
import { CLOCK_FORMAT } from '@/types/sleep-settings';

import i18next from '@/i18n';
import { formatDurationParts } from '@/i18n/duration';

import dayjs, { type Dayjs } from 'dayjs';

import { HOURS_PER_DAY, MINUTES_PER_HOUR } from '@/config/units';

type DateInput = string | number | Dayjs;

/** 날짜를 '9월 29일' 형식으로 변환하는 함수 */
export const formatMonthDay = (date: DateInput, locale: Locale) => {
	return dayjs(date).format(i18next.t('common.dateFormat.monthDay', { lng: locale }));
};

/** 날짜를 '9월 29일 (화)' 형식으로 변환하는 함수 */
export const formatMonthDayWeekday = (date: DateInput, locale: Locale) => {
	return dayjs(date).format(i18next.t('common.dateFormat.monthDayWeekday', { lng: locale }));
};

/** 날짜를 '9월 29일 화요일' 형식으로 변환하는 함수 */
export const formatMonthDayLongWeekday = (date: DateInput, locale: Locale) => {
	return dayjs(date).format(i18next.t('common.dateFormat.monthDayLongWeekday', { lng: locale }));
};

/** 날짜를 '2026년 9월' 형식으로 변환하는 함수 */
export const formatYearMonth = (date: DateInput, locale: Locale) => {
	return dayjs(date).format(i18next.t('common.dateFormat.yearMonth', { lng: locale }));
};

/** 날짜를 '10월' 형식으로 변환하는 함수 */
export const formatMonth = (date: DateInput) => {
	return dayjs(date).format('MMMM');
};

/** '15분 전' 형식 변환 함수 */
export const formatTimeAgo = (date: DateInput, locale: Locale, now: DateInput = dayjs()) => {
	const minutes = dayjs(now).diff(date, 'minute');

	if (minutes < MINUTES_PER_HOUR) {
		return i18next.t('community.feed.timeAgo.minutes', { count: Math.max(1, minutes), lng: locale });
	}

	const hours = dayjs(now).diff(date, 'hour');

	if (hours < HOURS_PER_DAY) {
		return i18next.t('community.feed.timeAgo.hours', { count: hours, lng: locale });
	}

	const days = dayjs(now).startOf('day').diff(dayjs(date).startOf('day'), 'day');

	return days === 1
		? i18next.t('community.feed.timeAgo.yesterday', { lng: locale })
		: i18next.t('community.feed.timeAgo.days', { count: days, lng: locale });
};

/** 시각을 '오후 3시' 형식으로 변환하는 함수 */
export const formatHour = (date: DateInput, locale: Locale) => {
	return dayjs(date).format(i18next.t('common.dateFormat.hour', { lng: locale }));
};

/** '9월 29일 오후 3:00' 형식 변환 함수 */
export const formatMonthDayTime = (date: DateInput, locale: Locale) => {
	return `${formatMonthDay(date, locale)} ${dayjs(date).format('LT')}`;
};

/** 오늘이면 시각만 표시하는 날짜 변환 함수 */
export const formatTimeOrDateTime = (date: DateInput, locale: Locale, now: DateInput = dayjs()) => {
	const parsedDate = dayjs(date);

	return parsedDate.isSame(now, 'day') ? parsedDate.format('LT') : formatMonthDayTime(date, locale);
};

/** 밀리초를 '1시간 5분' 형식으로 변환하는 함수 */
export const formatDuration = (ms: number, locale: Locale) => {
	const duration = dayjs.duration(Math.max(0, ms));

	return duration.asMinutes() < 1
		? formatDurationParts(dayjs.duration(Math.round(duration.asSeconds()), 'seconds'), locale)
		: formatDurationParts(dayjs.duration(Math.floor(duration.asMinutes()), 'minutes'), locale);
};

/** '+1시간 5분' 형식 변환 함수 */
export const formatDurationChange = (changeMs: number, locale: Locale) => {
	if (changeMs === 0) {
		return i18next.t('report.noChange', { lng: locale });
	}

	return `${changeMs > 0 ? '+' : '-'}${formatDuration(Math.abs(changeMs), locale)}`;
};

/** 밀리초를 '2일 1시간 5분' 형식으로 변환하는 함수 */
export const formatDurationWithDays = (ms: number, locale: Locale) => {
	const duration = dayjs.duration(ms);
	const days = Math.floor(duration.asDays());
	const remainderMs = duration.subtract(days, 'day').asMilliseconds();

	if (days === 0) {
		return formatDuration(ms, locale);
	}

	const dayText = i18next.t('common.duration.days', { value: days, lng: locale });

	return remainderMs === 0 ? dayText : `${dayText} ${formatDuration(remainderMs, locale)}`;
};

/** 숫자를 앱 언어의 숫자로 변환하는 함수 */
export const formatNumber = (value: number, locale: Locale, options?: Intl.NumberFormatOptions) => {
	return new Intl.NumberFormat(locale, { useGrouping: false, ...options }).format(value);
};

/** 밀리초를 내림한 시간 수 문자열로 변환하는 함수 */
export const formatWholeHours = (ms: number, locale: Locale) => {
	return formatNumber(Math.floor(dayjs.duration(ms).asHours()), locale);
};

/** 밀리초를 '1:05:30' 형식으로 변환하는 함수 */
export const formatTimer = (ms: number, locale: Locale) => {
	const duration = dayjs.duration(Math.max(0, ms));
	const hours = Math.floor(duration.asHours());
	const seconds = formatNumber(duration.seconds(), locale, { minimumIntegerDigits: 2 });

	if (hours === 0) {
		return `${formatNumber(duration.minutes(), locale)}:${seconds}`;
	}

	return `${formatNumber(hours, locale)}:${formatNumber(duration.minutes(), locale, { minimumIntegerDigits: 2 })}:${seconds}`;
};

/** 시각을 오후 10:30 형식으로 변환 */
export const formatClock = (time: string) => {
	return dayjs(time, CLOCK_FORMAT).format('LT');
};
