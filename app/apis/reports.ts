import { mockServer } from "@/mocks/server"
import { type Report, type ReportPeriod, reportSchema } from "@/types/apis/reports"

export async function fetchReport(period: ReportPeriod, start: string): Promise<Report> {
	return reportSchema.parse(await mockServer.reports.get(period, start))
}
