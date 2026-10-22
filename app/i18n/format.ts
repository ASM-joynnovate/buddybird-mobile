import type { Locale } from '@/types/locale';
import { CLOCK_FORMAT } from '@/types/sleep-settings';

import i18next from '@/i18n';
import { durationText } from '@/i18n/duration';

import dayjs, { type Dayjs } from 'dayjs';

type DateInput = string | number | Dayjs;

/** 날짜를 '9월 29일' 형식으로 변환하는 함수 */
export const formatMonthDay = (value: DateInput, locale: Locale) => {
	return dayjs(value).format(i18next.t('common.dateFormat.monthDay', { lng: locale }));
};

/** 날짜를 '9월 29일 (화)' 형식으로 변환하는 함수 */
export const formatMonthDayWeekday = (value: DateInput, locale: Locale) => {
	return dayjs(value).format(i18next.t('common.dateFormat.monthDayWeekday', { lng: locale }));
};

/** 날짜를 '9월 29일 화요일' 형식으로 변환하는 함수 */
export const formatMonthDayLongWeekday = (value: DateInput, locale: Locale) => {
	return dayjs(value).format(i18next.t('common.dateFormat.monthDayLongWeekday', { lng: locale }));
};

/** 날짜를 '2026년 9월' 형식으로 변환하는 함수 */
export const formatYearMonth = (value: DateInput, locale: Locale) => {
	return dayjs(value).format(i18next.t('common.dateFormat.yearMonth', { lng: locale }));
};

/** 날짜를 '10월' 형식으로 변환하는 함수 */
export const formatMonth = (value: DateInput) => {
	return dayjs(value).format('MMMM');
};

/** 지난 시간을 '15분 전', '어제' 형식으로 변환하는 함수 */
export const formatTimeAgo = (value: DateInput, locale: Locale, now: DateInput = dayjs()) => {
	const minutes = dayjs(now).diff(value, 'minute');

	if (minutes < 60) {
		return i18next.t('community.feed.timeAgo.minutes', { count: Math.max(1, minutes), lng: locale });
	}

	const hours = dayjs(now).diff(value, 'hour');

	if (hours < 24) {
		return i18next.t('community.feed.timeAgo.hours', { count: hours, lng: locale });
	}

	const days = dayjs(now).startOf('day').diff(dayjs(value).startOf('day'), 'day');

	return days === 1
		? i18next.t('community.feed.timeAgo.yesterday', { lng: locale })
		: i18next.t('community.feed.timeAgo.days', { count: days, lng: locale });
};

/** 시각을 '오후 3시' 형식으로 변환하는 함수 */
export const formatHour = (value: DateInput, locale: Locale) => {
	return dayjs(value).format(i18next.t('common.dateFormat.hour', { lng: locale }));
};

/** 날짜를 '9월 29일 오후 3:00' 형식으로 변환하는 함수 */
export const formatMonthDayTime = (value: DateInput, locale: Locale) => {
	return `${formatMonthDay(value, locale)} ${dayjs(value).format('LT')}`;
};

/** 오늘이면 '오후 3:00', 다른 날이면 '9월 29일 오후 3:00' 형식으로 변환하는 함수 */
export const formatTimeOrDateTime = (value: DateInput, locale: Locale, now: DateInput = dayjs()) => {
	const date = dayjs(value);

	return date.isSame(now, 'day') ? date.format('LT') : formatMonthDayTime(value, locale);
};

/** 밀리초를 '1시간 5분' 형식으로 변환하는 함수 */
export const formatDuration = (ms: number, locale: Locale) => {
	const duration = dayjs.duration(Math.max(0, ms));

	return duration.asMinutes() < 1
		? durationText(dayjs.duration(Math.round(duration.asSeconds()), 'seconds'), locale)
		: durationText(dayjs.duration(Math.floor(duration.asMinutes()), 'minutes'), locale);
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

/** 밀리초를 '1:05:30' 형식으로 변환하는 함수 */
export const formatTimer = (ms: number) => {
	const duration = dayjs.duration(Math.max(0, ms));
	const hours = Math.floor(duration.asHours());

	return hours > 0 ? `${hours}:${duration.format('mm:ss')}` : duration.format('m:ss');
};

/** '22:30:00' 형식의 시각을 '오후 10:30' 형식으로 변환하는 함수 */
export const formatClock = (time: string) => {
	return dayjs(time, CLOCK_FORMAT).format('LT');
};
