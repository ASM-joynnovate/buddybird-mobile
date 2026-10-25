import { type Report, type ReportParams, reportSchema } from '@/types/apis/reports';

import { apiRequest } from '@/lib/api';

export const getReport = async ({ period, start }: ReportParams): Promise<Report> => {
	const { data: report } = await apiRequest('/api/v1/reports', reportSchema, { searchParams: { period, start } });

	return report;
};
