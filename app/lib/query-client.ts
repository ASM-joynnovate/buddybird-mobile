import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { ApiError, UNAUTHORIZED_STATUS } from '@/types/apis/common';

import { DEFAULT_STALE_TIME_MS } from '@/config';

const MAX_RETRIES = 2;

let onUnauthorized: (() => void) | undefined;

/** 인증 만료 시 실행할 함수 등록 */
export const setUnauthorizedHandler = (handler: () => void) => {
	onUnauthorized = handler;
};

/** 쿼리 재시도 여부를 반환하는 함수 */
const retryPolicy = (failureCount: number, error: unknown) =>
	failureCount < MAX_RETRIES && error instanceof ApiError && error.retryable;

/** 401 응답 시 인증 만료 함수 실행 */
const handleUnauthorized = (error: unknown) => {
	if (error instanceof ApiError && error.status === UNAUTHORIZED_STATUS) {
		onUnauthorized?.();
	}
};

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
