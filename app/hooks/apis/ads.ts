import { queryOptions, useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { getAdList, postAdEvents } from '@/apis/ads';

import type { GetAdListParams } from '@/types/apis/ads';

import { apiKeys } from '@/hooks/apis/keys';
import { adKeys } from '@/hooks/apis/keys/ads';

import { reportError } from '@/services/telemetry/client';

/** 광고 목록 조회 Hook에 사용할 옵션 */
export const getAdListOptions = ({ kind }: GetAdListParams) =>
	queryOptions({ queryKey: adKeys.list(kind), queryFn: () => getAdList({ kind }) });
/** 광고 목록 조회 Hook */
export const useGetAdList = ({ kind }: GetAdListParams) => {
	return useSuspenseQuery(getAdListOptions({ kind }));
};
/** suspense 없는 광고 목록 조회 Hook */
export const useGetAdListQuery = ({ kind }: GetAdListParams) => {
	return useQuery(getAdListOptions({ kind }));
};

/** 광고 이벤트 전송 Hook */
export const useSendAdEvents = () => {
	return useMutation({
		mutationKey: apiKeys.mutation('ads', 'events', 'create'),
		mutationFn: postAdEvents,
		onError: (error) => reportError(error, 'ad_events'),
	});
};
