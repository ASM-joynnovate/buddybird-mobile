import { infiniteQueryOptions, useQueryClient, useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { getNotificationList, postAllNotificationsRead, postNotificationRead } from '@/apis/notifications';

import { apiKeys } from '@/hooks/apis/keys';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { reportError } from '@/services/telemetry/client';

/** 알림 목록 조회 Hook에 사용할 옵션 */
export const getNotificationListOptions = () =>
	infiniteQueryOptions({
		queryKey: apiKeys.notifications(),
		queryFn: ({ pageParam }) => getNotificationList({ page: pageParam }),
		initialPageParam: 1,
		getNextPageParam: (lastPage) => (lastPage.meta.is_last ? undefined : lastPage.meta.current_page + 1),
	});
/** 알림 목록 조회 Hook */
export const useGetNotificationList = () => {
	return useSuspenseInfiniteQuery(getNotificationListOptions());
};

/** 알림 읽음 처리 Hook */
export const useReadNotification = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('notifications', 'read'),
		mutationFn: postNotificationRead,
		onSuccess: () =>
			Promise.all([
				queryClient.invalidateQueries({ queryKey: apiKeys.notifications() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.home() }),
			]),
		onError: (error) => reportError(error, 'notification_read'),
	});
};

/** 알림 모두 읽음 처리 Hook */
export const useReadAllNotifications = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('notifications', 'read-all'),
		mutationFn: postAllNotificationsRead,
		onSuccess: () =>
			Promise.all([
				queryClient.invalidateQueries({ queryKey: apiKeys.notifications() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.home() }),
			]),
		onError: (error) => reportError(error, 'notification_read_all'),
	});
};
