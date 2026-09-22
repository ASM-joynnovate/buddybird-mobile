import { infiniteQueryOptions, mutationOptions, queryOptions } from "@tanstack/react-query"

import { fetchNotice, fetchNotices, markNoticeRead } from "@/apis/notices"
import { apiKeys } from "@/hooks/apis/keys"
import { queryClient } from "@/lib/query-client"

export const noticesQueryOptions = () =>
	infiniteQueryOptions({
		queryKey: apiKeys.notices.list(),
		queryFn: ({ pageParam }) => fetchNotices(pageParam),
		initialPageParam: 1,
		getNextPageParam: (last) => (last.meta.is_last ? undefined : last.meta.current_page + 1),
	})

export const noticeQueryOptions = (id: string) =>
	queryOptions({ queryKey: apiKeys.notices.detail(id), queryFn: () => fetchNotice(id) })

export const readNoticeMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("notices", "read"),
		mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
			markNoticeRead(id, idempotencyKey),
		onSuccess: () =>
			Promise.all([
				queryClient.invalidateQueries({ queryKey: apiKeys.notices.all() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.home() }),
			]),
	})
