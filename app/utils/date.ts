import type { ReportPeriod } from '@/types/report-period';

import dayjs, { type ConfigType } from 'dayjs';

/** YYYY-MM-DD 모양의 날짜 문자열 */
export const localDate = (date?: ConfigType) => {
	return dayjs(date).format('YYYY-MM-DD');
};

/** 두 날짜 사이의 기간 단위 개수 */
export const periodsBetween = (period: ReportPeriod, from: string, to: string) => {
	return dayjs(to).diff(from, period);
};

/** 생일부터 지금까지의 개월 수, 생일이 없거나 잘못된 날짜면 null */
export const ageMonths = (birthdate: string | null, now = dayjs()) => {
	if (!birthdate) {
		return null;
	}

	const birth = dayjs(birthdate);

	if (!birth.isValid()) {
		return null;
	}

	return Math.max(0, dayjs(now).diff(birth, 'month'));
};
