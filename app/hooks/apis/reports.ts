import { queryOptions } from "@tanstack/react-query"

import { fetchReport } from "@/apis/reports"
import { apiKeys } from "@/hooks/apis/keys"

export const reportQueryOptions = (period: Parameters<typeof fetchReport>[0], start: string) =>
	queryOptions({
		queryKey: apiKeys.reports.detail(period, start),
		queryFn: () => fetchReport(period, start),
	})
