import { mockServer } from "@/apis/mock/server"
import { type Report, type ReportPeriod, reportSchema } from "@/mocks/types"

export async function fetchReport(period: ReportPeriod, start: string): Promise<Report> {
	return reportSchema.parse(await mockServer.reports.get(period, start))
}
