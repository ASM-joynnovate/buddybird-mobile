import { mutationOptions, queryOptions } from "@tanstack/react-query"

import {
	createParrot,
	deleteParrot,
	fetchParrots,
	type ParrotInput,
	updateParrot,
} from "@/apis/parrots"
import { apiKeys } from "@/hooks/apis/keys"
import { queryClient } from "@/lib/query-client"

const refresh = () => queryClient.invalidateQueries({ queryKey: apiKeys.parrots.all() })

export const parrotsQueryOptions = () =>
	queryOptions({ queryKey: apiKeys.parrots.all(), queryFn: fetchParrots })

export const saveParrotMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("parrots", "save"),
		mutationFn: ({
			id,
			input,
			idempotencyKey,
		}: {
			id: string | null
			input: ParrotInput
			idempotencyKey: string
		}) => (id ? updateParrot(id, input, idempotencyKey) : createParrot(input, idempotencyKey)),
		onSuccess: refresh,
	})

export const deleteParrotMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("parrots", "delete"),
		mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
			deleteParrot(id, idempotencyKey),
		onSuccess: refresh,
	})
