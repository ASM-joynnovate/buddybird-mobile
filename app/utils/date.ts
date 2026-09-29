import type { ReportPeriod } from '@/types/report-period';

import dayjs, { type ConfigType } from 'dayjs';

/** 날짜를 'YYYY-MM-DD' 형식으로 변환하는 함수 */
export const localDate = (date?: ConfigType) => {
	return dayjs(date).format('YYYY-MM-DD');
};

/** 두 날짜 사이의 기간 수를 반환하는 함수 */
export const periodsBetween = (period: ReportPeriod, from: string, to: string) => {
	return dayjs(to).diff(from, period);
};

/** 생일부터 현재까지의 개월 수를 반환하는 함수 */
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
