import type { QueryKey } from "@tanstack/react-query"

import { queryClient } from "@/lib/query-client"

export function invalidate(...keys: QueryKey[]): Promise<void[]> {
	return Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })))
}
