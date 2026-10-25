import {
	infiniteQueryOptions,
	queryOptions,
	useInfiniteQuery,
	useQueryClient,
	useSuspenseInfiniteQuery,
	useSuspenseQuery,
} from '@tanstack/react-query';

import { getAnnouncement, getAnnouncementList, postAnnouncementRead } from '@/apis/announcements';

import { apiKeys } from '@/hooks/apis/keys';
import { announcementKeys } from '@/hooks/apis/keys/announcements';
import { homeKeys } from '@/hooks/apis/keys/home';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { nextPageNumber } from '@/lib/api';

import { reportError } from '@/services/telemetry/client';

/** 공지 목록 조회 Hook에 사용할 옵션 */
export const getAnnouncementListOptions = () =>
	infiniteQueryOptions({
		queryKey: announcementKeys.list(),
		queryFn: ({ pageParam }) => getAnnouncementList({ page: pageParam }),
		initialPageParam: 1,
		getNextPageParam: nextPageNumber,
	});
/** 공지 목록 조회 Hook */
export const useGetAnnouncementList = () => {
	return useSuspenseInfiniteQuery(getAnnouncementListOptions());
};
/** suspense 없는 공지 목록 조회 Hook */
export const useGetAnnouncementListQuery = () => {
	return useInfiniteQuery(getAnnouncementListOptions());
};

/** 공지 상세 조회 Hook에 사용할 옵션 */
export const getAnnouncementOptions = ({ id }: { id: string }) =>
	queryOptions({ queryKey: announcementKeys.detail(id), queryFn: () => getAnnouncement({ id }) });
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
				queryClient.invalidateQueries({ queryKey: announcementKeys.all() }),
				queryClient.invalidateQueries({ queryKey: homeKeys.all() }),
			]),
		onError: (error) => reportError(error, 'announcement_read'),
	});
};
