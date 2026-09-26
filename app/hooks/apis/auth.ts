import { mutationOptions } from "@tanstack/react-query"

import { completeLogin, mergeAccount } from "@/apis/auth"
import { apiKeys } from "@/hooks/apis/keys"
import type { LoginRequest, MergeRequest } from "@/types/apis/auth"

export const loginMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("auth", "login"),
		mutationFn: ({ request, signal }: { request: LoginRequest; signal: AbortSignal }) =>
			completeLogin(request, signal),
		retry: false,
		meta: { skipUnauthorizedSignOut: true },
	})

export const mergeMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("auth", "merge"),
		mutationFn: (request: MergeRequest) => mergeAccount(request),
		retry: false,
		meta: { skipUnauthorizedSignOut: true },
	})
