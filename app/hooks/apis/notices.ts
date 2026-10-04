import {
	infiniteQueryOptions,
	queryOptions,
	useQueryClient,
	useSuspenseInfiniteQuery,
	useSuspenseQuery,
} from '@tanstack/react-query';

import { getNotice, getNoticeList, postNoticeRead } from '@/apis/notices';

import { apiKeys } from '@/hooks/apis/keys';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { reportError } from '@/services/telemetry/client';

/** 공지 목록 조회 Hook에 사용할 옵션 */
export const getNoticeListOptions = () =>
	infiniteQueryOptions({
		queryKey: apiKeys.notices.list(),
		queryFn: ({ pageParam }) => getNoticeList({ page: pageParam }),
		initialPageParam: 1,
		getNextPageParam: (lastPage) => (lastPage.meta.is_last ? undefined : lastPage.meta.current_page + 1),
	});
/** 공지 목록 조회 Hook */
export const useGetNoticeList = () => {
	return useSuspenseInfiniteQuery(getNoticeListOptions());
};

/** 공지 상세 조회 Hook에 사용할 옵션 */
export const getNoticeOptions = ({ id }: { id: string }) =>
	queryOptions({ queryKey: apiKeys.notices.detail(id), queryFn: () => getNotice({ id }) });
/** 공지 상세 조회 Hook */
export const useGetNotice = ({ id }: { id: string }) => {
	return useSuspenseQuery(getNoticeOptions({ id }));
};

/** 공지 읽음 처리 Hook */
export const useReadNotice = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('notices', 'read'),
		mutationFn: postNoticeRead,
		onSuccess: () =>
			Promise.all([
				queryClient.invalidateQueries({ queryKey: apiKeys.notices.all() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.home() }),
			]),
		onError: (error) => reportError(error, 'notice_read'),
	});
};
