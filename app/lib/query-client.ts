import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"

import { ApiError } from "@/types/apis/common"

const MAX_RETRIES = 2

export const QUERY_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

let onUnauthorized: (() => void) | undefined

export function setUnauthorizedHandler(handler: () => void) {
	onUnauthorized = handler
}

const retryPolicy = (count: number, error: unknown) =>
	count < MAX_RETRIES && error instanceof ApiError && error.retryable

function handleUnauthorized(error: unknown) {
	if (error instanceof ApiError && error.status === 401) {
		onUnauthorized?.()
	}
}

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: { staleTime: 30_000, gcTime: QUERY_CACHE_MAX_AGE_MS, retry: retryPolicy },
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
