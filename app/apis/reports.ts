import { type Report, reportSchema } from '@/types/apis/reports';

import { apiRequest } from '@/lib/api';

export const getReport = async ({
	period,
	start,
}: {
	period: Report['period']['unit'];
	start: string;
}): Promise<Report> => {
	const { data: report } = await apiRequest('/api/v1/reports', reportSchema, { searchParams: { period, start } });

	return report;
};
