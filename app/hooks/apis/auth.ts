import { mutationOptions } from "@tanstack/react-query"

import { completeLogin } from "@/apis/auth"
import { apiKeys } from "@/hooks/apis/keys"

export const loginMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("auth", "login"),
		mutationFn: ({ signal }: { signal: AbortSignal }) => completeLogin(signal),
		retry: false,
	})
