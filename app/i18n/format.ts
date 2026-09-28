import type { Locale } from '@/types/locale';
import { CLOCK_FORMAT } from '@/types/sleep-settings';

import { durationText } from '@/i18n/duration';

import dayjs, { type Dayjs } from 'dayjs';

type DateInput = string | number | Dayjs;

const dateFormats: Record<Locale, { monthDay: string; monthDayWeekday: string; yearMonth: string }> = {
	'ko-KR': { monthDay: 'MMMM D일', monthDayWeekday: 'MMMM D일 (ddd)', yearMonth: 'YYYY년 MMMM' },
	'en-US': { monthDay: 'MMMM D', monthDayWeekday: 'ddd, MMMM D', yearMonth: 'MMMM YYYY' },
};

/** 언어에 맞춘 월과 일 문구 */
export const formatMonthDay = (value: DateInput, locale: Locale) => {
	return dayjs(value).format(dateFormats[locale].monthDay);
};

/** 언어에 맞춘 월, 일, 요일 문구 */
export const formatMonthDayWeekday = (value: DateInput, locale: Locale) => {
	return dayjs(value).format(dateFormats[locale].monthDayWeekday);
};

/** 언어에 맞춘 연도와 월 문구 */
export const formatYearMonth = (value: DateInput, locale: Locale) => {
	return dayjs(value).format(dateFormats[locale].yearMonth);
};

/** 월, 일과 시각 문구 */
export const formatMonthDayTime = (value: DateInput, locale: Locale) => {
	return `${formatMonthDay(value, locale)} ${dayjs(value).format('LT')}`;
};

/** 오늘이면 시각, 다른 날이면 월, 일과 시각 문구 */
export const formatTimeOrDateTime = (value: DateInput, locale: Locale, now: DateInput = dayjs()) => {
	const date = dayjs(value);

	return date.isSame(now, 'day') ? date.format('LT') : formatMonthDayTime(value, locale);
};

/** 1분 미만은 초를 반올림하고 1분 이상은 분 아래를 버린 시간 길이 문구 */
export const formatDuration = (ms: number, locale: Locale) => {
	const duration = dayjs.duration(Math.max(0, ms));

	return duration.asMinutes() < 1
		? durationText(dayjs.duration(Math.round(duration.asSeconds()), 'seconds'), locale)
		: durationText(dayjs.duration(Math.floor(duration.asMinutes()), 'minutes'), locale);
};

/** 하루 이상이면 일 수를 앞에 붙인 시간 길이 문구 */
export const formatDurationWithDays = (ms: number, locale: Locale) => {
	const duration = dayjs.duration(ms);
	const days = Math.floor(duration.asDays());
	const remainderMs = duration.subtract(days, 'day').asMilliseconds();

	if (days === 0) {
		return formatDuration(ms, locale);
	}

	const dayText = `${days}${locale === 'ko-KR' ? '일' : 'd'}`;

	return remainderMs === 0 ? dayText : `${dayText} ${formatDuration(remainderMs, locale)}`;
};

/** 시:분:초나 분:초 모양의 시계 문구 */
export const formatTimer = (ms: number) => {
	const duration = dayjs.duration(Math.max(0, ms));
	const hours = Math.floor(duration.asHours());

	return hours > 0 ? `${hours}:${duration.format('mm:ss')}` : duration.format('m:ss');
};

/** 시:분:초 값을 언어에 맞춘 시각 문구 */
export const formatClock = (time: string) => {
	return dayjs(time, CLOCK_FORMAT).format('LT');
};
