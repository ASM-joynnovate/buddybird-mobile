import { mutationOptions, queryOptions } from "@tanstack/react-query"

import { fetchMe, updateMe, type UpdateMeInput } from "@/apis/users"
import { apiKeys } from "@/hooks/apis/keys"
import { queryClient } from "@/lib/query-client"

export const meQueryOptions = () => queryOptions({ queryKey: apiKeys.me(), queryFn: fetchMe })

export const updateMeMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("users", "me", "update"),
		mutationFn: (input: UpdateMeInput) => updateMe(input),
		onSuccess: (user) => queryClient.setQueryData(apiKeys.me(), user),
	})
