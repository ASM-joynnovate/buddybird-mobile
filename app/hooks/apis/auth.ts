import { mutationOptions } from "@tanstack/react-query"

import { completeLogin } from "@/apis/auth"
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
