import { mutationOptions } from "@tanstack/react-query"

import { completeLogin, logout, withdraw } from "@/apis/auth"
import { apiKeys } from "@/hooks/apis/keys"
import type { LoginRequest } from "@/types/apis/auth"

export const loginMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("auth", "login"),
		mutationFn: ({ request, signal }: { request: LoginRequest; signal: AbortSignal }) =>
			completeLogin(request, signal),
		retry: false,
		meta: { skipUnauthorizedSignOut: true },
	})

export const logoutMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("auth", "logout"),
		mutationFn: () => logout(),
	})

export const withdrawMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("auth", "withdraw"),
		mutationFn: () => withdraw(),
	})
