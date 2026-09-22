import { queryOptions } from "@tanstack/react-query"

import { fetchReport, type ReportPeriod } from "@/apis/reports"
import { apiKeys } from "@/hooks/apis/keys"

export const reportQueryOptions = (period: ReportPeriod, start: string) =>
	queryOptions({
		queryKey: apiKeys.reports.detail(period, start),
		queryFn: () => fetchReport(period, start),
	})
