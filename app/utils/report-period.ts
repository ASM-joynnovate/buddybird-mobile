import { type ReportPeriod, reportPeriodSchema } from '@/types/report-period';

import { z } from 'zod';

import dayjs, { type Dayjs } from 'dayjs';

import { localDate } from '@/utils/date';

const paramsSchema = z.object({
	period: reportPeriodSchema.optional(),
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
});

/** 날짜가 속한 기간의 시작 시각, 주는 월요일부터 */
const _periodStart = (period: ReportPeriod, date: Dayjs) => {
	if (period === 'week') {
		return date.subtract((date.day() + 6) % 7, 'day').startOf('day');
	}

	return date.startOf(period);
};

/** 오늘이 속한 기간의 시작 날짜 */
export const latestStart = (period: ReportPeriod) => {
	return localDate(_periodStart(period, dayjs()));
};

/** route params에서 읽은 리포트 기간 단위와 시작 날짜, 오늘 뒤의 기간은 오늘이 속한 기간으로 */
export const periodSelectionFromParams = (params: unknown) => {
	const parsed = paramsSchema.safeParse(params ?? {});
	const period = (parsed.success && parsed.data.period) || 'day';
	const date = parsed.success && parsed.data.date ? dayjs(parsed.data.date) : dayjs();
	const start = localDate(_periodStart(period, date));
	const latest = latestStart(period);

	return { period, start: start > latest ? latest : start };
};
