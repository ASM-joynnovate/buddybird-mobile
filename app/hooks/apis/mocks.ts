import { queryOptions } from "@tanstack/react-query"

import { fetchSessionsInRange } from "@/apis/mocks"
import { apiKeys } from "@/hooks/apis/keys"

export const sessionsInRangeQueryOptions = (from: Date, to: Date) =>
	queryOptions({
		queryKey: apiKeys.sessions.range(from.toISOString(), to.toISOString()),
		queryFn: () => fetchSessionsInRange(from, to),
	})
