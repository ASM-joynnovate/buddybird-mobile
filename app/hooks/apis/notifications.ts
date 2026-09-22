import { infiniteQueryOptions, mutationOptions } from "@tanstack/react-query"

import {
	fetchNotifications,
	markAllNotificationsRead,
	markNotificationRead,
} from "@/apis/notifications"
import { apiKeys } from "@/hooks/apis/keys"
import { queryClient } from "@/lib/query-client"

const refresh = () =>
	Promise.all([
		queryClient.invalidateQueries({ queryKey: apiKeys.notifications() }),
		queryClient.invalidateQueries({ queryKey: apiKeys.home() }),
	])

export const notificationsQueryOptions = () =>
	infiniteQueryOptions({
		queryKey: apiKeys.notifications(),
		queryFn: ({ pageParam }) => fetchNotifications(pageParam),
		initialPageParam: 1,
		getNextPageParam: (last) => (last.meta.is_last ? undefined : last.meta.current_page + 1),
	})

export const readNotificationMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("notifications", "read"),
		mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
			markNotificationRead(id, idempotencyKey),
		onSuccess: refresh,
	})

export const readAllNotificationsMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("notifications", "read-all"),
		mutationFn: ({ idempotencyKey }: { idempotencyKey: string }) =>
			markAllNotificationsRead(idempotencyKey),
		onSuccess: refresh,
	})
