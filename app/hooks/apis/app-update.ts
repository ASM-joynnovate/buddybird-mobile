import { queryOptions } from "@tanstack/react-query"

import { fetchUpdatePolicy, readUpdatePolicy } from "@/apis/app-update"
import { UPDATE_INTERVAL } from "@/services/updates/policy"

// Remote Config owns its cache. A failed attempt also starts the six-hour window.
export const updateQueryOptions = () =>
	queryOptions({
		queryKey: ["firebase", "update"],
		queryFn: fetchUpdatePolicy,
		initialData: readUpdatePolicy,
		initialDataUpdatedAt: 0,
		staleTime: UPDATE_INTERVAL,
		retry: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	})
