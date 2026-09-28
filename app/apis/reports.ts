import { type Report, reportSchema } from '@/types/apis/reports';

import { mockServer } from '@/mocks/server';

export async function fetchReport(period: Report['period'], start: string): Promise<Report> {
	return reportSchema.parse(await mockServer.reports.get(period, start));
}
