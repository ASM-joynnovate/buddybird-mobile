import {
	MutationCache,
	type MutationOptions,
	MutationObserver,
	QueryCache,
	QueryClient,
} from "@tanstack/react-query"

import { ApiError } from "@/lib/api"
import { getSupabase } from "@/lib/supabase"

const MAX_RETRIES = 2
const loginKey = "api,auth,login"

const retryPolicy = (count: number, error: unknown) =>
	count < MAX_RETRIES && error instanceof ApiError && error.retryable

function signOutOnUnauthorized(error: unknown, mutationKey?: readonly unknown[]) {
	if (error instanceof ApiError && error.status === 401 && mutationKey?.join() !== loginKey) {
		void getSupabase().auth.signOut({ scope: "local" })
	}
}

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: { staleTime: 30_000, retry: retryPolicy },
		mutations: { retry: retryPolicy, networkMode: "always" },
	},
	queryCache: new QueryCache({ onError: (error) => signOutOnUnauthorized(error) }),
	mutationCache: new MutationCache({
		onError: (error, _variables, _context, mutation) =>
			signOutOnUnauthorized(error, mutation.options.mutationKey),
	}),
})

export function runMutation<TData, TVariables>(
	options: MutationOptions<TData, Error, TVariables>,
	variables: TVariables,
) {
	return new MutationObserver(queryClient, options).mutate(variables)
}
