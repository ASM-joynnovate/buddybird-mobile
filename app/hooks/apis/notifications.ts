import {
	infiniteQueryOptions,
	queryOptions,
	useQueryClient,
	useSuspenseInfiniteQuery,
	useSuspenseQuery,
} from '@tanstack/react-query';

import {
	getNotification,
	getNotificationList,
	postAllNotificationsRead,
	postNotificationRead,
} from '@/apis/notifications';

import { apiKeys } from '@/hooks/apis/keys';
import { homeKeys } from '@/hooks/apis/keys/home';
import { notificationKeys } from '@/hooks/apis/keys/notifications';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { nextPageNumber } from '@/lib/api';

import { reportError } from '@/services/telemetry/client';

/** 알림 목록 조회 Hook에 사용할 옵션 */
export const getNotificationListOptions = () =>
	infiniteQueryOptions({
		queryKey: notificationKeys.list(),
		queryFn: ({ pageParam }) => getNotificationList({ page: pageParam }),
		initialPageParam: 1,
		getNextPageParam: nextPageNumber,
	});
/** 알림 목록 조회 Hook */
export const useGetNotificationList = () => {
	return useSuspenseInfiniteQuery(getNotificationListOptions());
};

/** 알림 상세 조회 Hook에 사용할 옵션 */
export const getNotificationOptions = ({ id }: { id: string }) =>
	queryOptions({ queryKey: notificationKeys.detail(id), queryFn: () => getNotification({ id }) });
/** 알림 상세 조회 Hook */
export const useGetNotification = ({ id }: { id: string }) => {
	return useSuspenseQuery(getNotificationOptions({ id }));
};

/** 알림 읽음 처리 Hook */
export const useReadNotification = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('notifications', 'read'),
		mutationFn: postNotificationRead,
		onSuccess: () =>
			Promise.all([
				queryClient.invalidateQueries({ queryKey: notificationKeys.all() }),
				queryClient.invalidateQueries({ queryKey: homeKeys.all() }),
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
				queryClient.invalidateQueries({ queryKey: notificationKeys.all() }),
				queryClient.invalidateQueries({ queryKey: homeKeys.all() }),
			]),
		onError: (error) => reportError(error, 'notification_read_all'),
	});
};
