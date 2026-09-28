import type { ReportPeriod } from '@/types/report-period';

import dayjs, { type ConfigType } from 'dayjs';

export function localDate(date?: ConfigType): string {
	return dayjs(date).format('YYYY-MM-DD');
}

export function periodsBetween(period: ReportPeriod, from: string, to: string): number {
	return dayjs(to).diff(from, period);
}

export function ageMonths(birthDate: string | null, now = new Date()): number | null {
	if (!birthDate) {
		return null;
	}

	const birth = dayjs(birthDate);

	if (!birth.isValid()) {
		return null;
	}

	return Math.max(0, dayjs(now).diff(birth, 'month'));
}
