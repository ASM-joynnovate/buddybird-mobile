import type { Session } from '@/types/apis/sessions';

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

/** 세션이 끝난 시각을 반환하는 함수, 끝난 시각이 없으면 현재 시각 */
export const sessionEndedAt = (period: Session['period']) => {
	return period.ended_at ? dayjs(period.ended_at) : dayjs();
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
