import {
	infiniteQueryOptions,
	queryOptions,
	useQueryClient,
	useSuspenseInfiniteQuery,
	useSuspenseQuery,
} from '@tanstack/react-query';

import { getAnnouncement, getAnnouncementList, postAnnouncementRead } from '@/apis/announcements';

import { apiKeys } from '@/hooks/apis/keys';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { reportError } from '@/services/telemetry/client';

/** 공지 목록 조회 Hook에 사용할 옵션 */
export const getAnnouncementListOptions = () =>
	infiniteQueryOptions({
		queryKey: apiKeys.announcements.list(),
		queryFn: ({ pageParam }) => getAnnouncementList({ page: pageParam }),
		initialPageParam: 1,
		getNextPageParam: (lastPage) => (lastPage.meta.is_last ? undefined : lastPage.meta.current_page + 1),
	});
/** 공지 목록 조회 Hook */
export const useGetAnnouncementList = () => {
	return useSuspenseInfiniteQuery(getAnnouncementListOptions());
};

/** 공지 상세 조회 Hook에 사용할 옵션 */
export const getAnnouncementOptions = ({ id }: { id: string }) =>
	queryOptions({ queryKey: apiKeys.announcements.detail(id), queryFn: () => getAnnouncement({ id }) });
/** 공지 상세 조회 Hook */
export const useGetAnnouncement = ({ id }: { id: string }) => {
	return useSuspenseQuery(getAnnouncementOptions({ id }));
};

/** 공지 읽음 처리 Hook */
export const useReadAnnouncement = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('announcements', 'read'),
		mutationFn: postAnnouncementRead,
		onSuccess: () =>
			Promise.all([
				queryClient.invalidateQueries({ queryKey: apiKeys.announcements.all() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.home() }),
			]),
		onError: (error) => reportError(error, 'announcement_read'),
	});
};
