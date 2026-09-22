import { mutationOptions, queryOptions } from "@tanstack/react-query"

import { fetchDevices, registerPushToken } from "@/apis/devices"
import { apiKeys } from "@/hooks/apis/keys"

export const devicesQueryOptions = () =>
	queryOptions({ queryKey: apiKeys.devices(), queryFn: fetchDevices })

export const registerPushTokenMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("devices", "push-token"),
		mutationFn: ({ token, idempotencyKey }: { token: string; idempotencyKey: string }) =>
			registerPushToken(token, idempotencyKey),
	})
