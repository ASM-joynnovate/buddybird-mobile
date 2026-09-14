import { queryOptions } from "@tanstack/react-query"

import { ensureAnonymousIdentity } from "@/apis/identity"

export const identityQueryOptions = () =>
	queryOptions({
		queryKey: ["firebase", "identity"],
		queryFn: ensureAnonymousIdentity,
		staleTime: Infinity,
		networkMode: "always",
	})
