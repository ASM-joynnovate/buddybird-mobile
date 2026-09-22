import { mutationOptions, queryOptions } from "@tanstack/react-query"

import {
	createParrot,
	deleteParrot,
	deleteParrotPhoto,
	fetchParrots,
	updateParrot,
	uploadParrotPhoto,
} from "@/apis/parrots"
import { apiKeys } from "@/hooks/apis/keys"
import { queryClient } from "@/lib/query-client"
import type { CreateParrotRequest } from "@/types/apis/parrots"

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
			input: CreateParrotRequest
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

export const uploadParrotPhotoMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("parrots", "photo", "upload"),
		mutationFn: ({
			id,
			uri,
			idempotencyKey,
		}: {
			id: string
			uri: string
			idempotencyKey: string
		}) => uploadParrotPhoto(id, uri, idempotencyKey),
		onSuccess: refresh,
	})

export const deleteParrotPhotoMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("parrots", "photo", "delete"),
		mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
			deleteParrotPhoto(id, idempotencyKey),
		onSuccess: refresh,
	})
