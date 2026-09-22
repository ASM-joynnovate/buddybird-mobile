import { mutationOptions, queryOptions } from "@tanstack/react-query"

import { disconnectDevice, fetchDevices, registerPushToken, renameDevice } from "@/apis/devices"
import { apiKeys } from "@/hooks/apis/keys"
import { queryClient } from "@/lib/query-client"

export const devicesQueryOptions = () =>
	queryOptions({ queryKey: apiKeys.devices(), queryFn: fetchDevices })

export const renameDeviceMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("devices", "rename"),
		mutationFn: ({
			id,
			name,
			idempotencyKey,
		}: {
			id: string
			name: string | null
			idempotencyKey: string
		}) => renameDevice(id, name, idempotencyKey),
		onSuccess: () =>
			Promise.all([
				queryClient.invalidateQueries({ queryKey: apiKeys.devices() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.home() }),
			]),
	})

export const disconnectDeviceMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("devices", "disconnect"),
		mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
			disconnectDevice(id, idempotencyKey),
		onSuccess: () =>
			Promise.all([
				queryClient.invalidateQueries({ queryKey: apiKeys.devices() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.sessions.all() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.home() }),
			]),
	})

export const registerPushTokenMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("devices", "push-token"),
		mutationFn: ({ token, idempotencyKey }: { token: string; idempotencyKey: string }) =>
			registerPushToken(token, idempotencyKey),
	})
