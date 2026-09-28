import { infiniteQueryOptions, mutationOptions, queryOptions } from '@tanstack/react-query';

import { getNotice, getNoticeList, postNoticeRead } from '@/apis/notices';

import { invalidate } from '@/hooks/apis/invalidate';
import { apiKeys } from '@/hooks/apis/keys';

export const noticesQueryOptions = () =>
	infiniteQueryOptions({
		queryKey: apiKeys.notices.list(),
		queryFn: ({ pageParam }) => getNoticeList({ page: pageParam }),
		initialPageParam: 1,
		getNextPageParam: (lastPage) => (lastPage.meta.is_last ? undefined : lastPage.meta.current_page + 1),
	});

export const noticeQueryOptions = (id: string) =>
	queryOptions({ queryKey: apiKeys.notices.detail(id), queryFn: () => getNotice({ id }) });

export const readNoticeMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('notices', 'read'),
		mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
			postNoticeRead({ id, idempotencyKey }),
		onSuccess: () => invalidate(apiKeys.notices.all(), apiKeys.home()),
	});
