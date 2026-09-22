import { queryOptions } from "@tanstack/react-query"

import { fetchAppUpdate } from "@/apis/app-update"
import { apiKeys } from "@/hooks/apis/keys"

export const appUpdateQueryOptions = () =>
	queryOptions({
		queryKey: apiKeys.appUpdate(),
		queryFn: fetchAppUpdate,
		retry: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	})
