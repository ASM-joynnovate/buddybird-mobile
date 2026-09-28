import { infiniteQueryOptions, mutationOptions } from '@tanstack/react-query';

import { getNotificationList, postAllNotificationsRead, postNotificationRead } from '@/apis/notifications';

import { invalidate } from '@/hooks/apis/invalidate';
import { apiKeys } from '@/hooks/apis/keys';

export const notificationsQueryOptions = () =>
	infiniteQueryOptions({
		queryKey: apiKeys.notifications(),
		queryFn: ({ pageParam }) => getNotificationList({ page: pageParam }),
		initialPageParam: 1,
		getNextPageParam: (lastPage) => (lastPage.meta.is_last ? undefined : lastPage.meta.current_page + 1),
	});

export const readNotificationMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('notifications', 'read'),
		mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
			postNotificationRead({ id, idempotencyKey }),
		onSuccess: () => invalidate(apiKeys.notifications(), apiKeys.home()),
	});

export const readAllNotificationsMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('notifications', 'read-all'),
		mutationFn: ({ idempotencyKey }: { idempotencyKey: string }) => postAllNotificationsRead({ idempotencyKey }),
		onSuccess: () => invalidate(apiKeys.notifications(), apiKeys.home()),
	});
