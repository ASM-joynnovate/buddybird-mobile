import type { ReportPeriod } from '@/types/report-period';

import dayjs, { type Dayjs } from 'dayjs';

import { localDate } from '@/utils/date';

/** 날짜가 속한 기간의 시작 시각을 반환하는 함수 */
const periodStart = (period: ReportPeriod, date: Dayjs) => {
	if (period === 'week') {
		return date.startOf('isoWeek');
	}

	return date.startOf(period);
};

/** 오늘이 속한 기간의 시작 날짜를 반환하는 함수 */
export const latestStart = (period: ReportPeriod) => {
	return localDate(periodStart(period, dayjs()));
};

/** 기간 시작 날짜를 step만큼 이동하는 함수 */
export const shiftedStart = (period: ReportPeriod, start: string, step: number) => {
	return localDate(dayjs(start).add(step, period));
};
