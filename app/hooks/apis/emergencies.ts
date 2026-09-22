import { mutationOptions, queryOptions } from "@tanstack/react-query"

import { confirmEmergency, deleteEmergency, fetchEmergency } from "@/apis/emergencies"
import { apiKeys } from "@/hooks/apis/keys"
import { ApiError } from "@/lib/api"
import { queryClient } from "@/lib/query-client"

export function isDeletedRecord(error: unknown): boolean {
	return error instanceof ApiError && error.status === 404
}

export const emergencyQueryOptions = (id: string) =>
	queryOptions({
		queryKey: apiKeys.emergencies.detail(id),
		queryFn: () => fetchEmergency(id),
		retry: (count, error) => count < 2 && error instanceof ApiError && error.retryable,
	})

export const confirmEmergencyMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("emergencies", "confirm"),
		mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
			confirmEmergency(id, idempotencyKey),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: apiKeys.home() }),
	})

export const deleteEmergencyMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("emergencies", "delete"),
		mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
			deleteEmergency(id, idempotencyKey),
		onSuccess: (_data, { id }) => {
			queryClient.removeQueries({ queryKey: apiKeys.emergencies.detail(id) })

			return Promise.all([
				queryClient.invalidateQueries({ queryKey: apiKeys.sessions.all() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.home() }),
			])
		},
	})
