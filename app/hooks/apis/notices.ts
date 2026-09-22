import { mutationOptions, queryOptions } from "@tanstack/react-query"

import { fetchNotice, fetchNotices, markNoticeRead } from "@/apis/notices"
import { apiKeys } from "@/hooks/apis/keys"
import { queryClient } from "@/lib/query-client"

export const noticesQueryOptions = () =>
	queryOptions({ queryKey: apiKeys.notices.list(), queryFn: fetchNotices })

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
