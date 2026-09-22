import { queryOptions } from "@tanstack/react-query"

import { fetchHomeSummary } from "@/apis/home"
import { apiKeys } from "@/hooks/apis/keys"

export const homeSummaryQueryOptions = () =>
	queryOptions({ queryKey: apiKeys.home(), queryFn: fetchHomeSummary })
