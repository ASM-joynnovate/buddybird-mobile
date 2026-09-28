import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { ApiError, UNAUTHORIZED_STATUS } from '@/types/apis/common';

import { DEFAULT_STALE_TIME_MS } from '@/config';

const MAX_RETRIES = 2;

let onUnauthorized: (() => void) | undefined;

export function setUnauthorizedHandler(handler: () => void) {
	onUnauthorized = handler;
}

const retryPolicy = (failureCount: number, error: unknown) =>
	failureCount < MAX_RETRIES && error instanceof ApiError && error.retryable;

function handleUnauthorized(error: unknown) {
	if (error instanceof ApiError && error.status === UNAUTHORIZED_STATUS) {
		onUnauthorized?.();
	}
}

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: DEFAULT_STALE_TIME_MS,
			retry: retryPolicy,
			throwOnError: true,
		},
		mutations: { retry: retryPolicy, networkMode: 'always' },
	},
	queryCache: new QueryCache({ onError: handleUnauthorized }),
	mutationCache: new MutationCache({
		onError: (error, _variables, _context, mutation) => {
			if (!mutation.meta?.skipUnauthorizedSignOut) {
				handleUnauthorized(error);
			}
		},
	}),
});
