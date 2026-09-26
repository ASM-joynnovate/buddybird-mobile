import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"

import { DEFAULT_STALE_TIME_MS, QUERY_CACHE_MAX_AGE_MS } from "@/config"
import { ApiError, UNAUTHORIZED_STATUS } from "@/types/apis/common"

const MAX_RETRIES = 2

let onUnauthorized: (() => void) | undefined

export function setUnauthorizedHandler(handler: () => void) {
	onUnauthorized = handler
}

const retryPolicy = (count: number, error: unknown) =>
	count < MAX_RETRIES && error instanceof ApiError && error.retryable

function handleUnauthorized(error: unknown) {
	if (error instanceof ApiError && error.status === UNAUTHORIZED_STATUS) {
		onUnauthorized?.()
	}
}

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: DEFAULT_STALE_TIME_MS,
			gcTime: QUERY_CACHE_MAX_AGE_MS,
			retry: retryPolicy,
		},
		mutations: { retry: retryPolicy, networkMode: "always" },
	},
	queryCache: new QueryCache({ onError: handleUnauthorized }),
	mutationCache: new MutationCache({
		onError: (error, _variables, _context, mutation) => {
			if (!mutation.meta?.skipUnauthorizedSignOut) {
				handleUnauthorized(error)
			}
		},
	}),
})
