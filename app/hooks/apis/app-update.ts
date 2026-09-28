import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getAppUpdate } from '@/apis/app-update';

import { apiKeys } from '@/hooks/apis/keys';

/** 앱 업데이트 정보 조회 옵션 */
export const getAppUpdateOptions = () =>
	queryOptions({
		queryKey: apiKeys.appUpdate(),
		queryFn: getAppUpdate,
		retry: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});
/** 앱 업데이트 정보 조회 훅 */
export const useGetAppUpdate = () => {
	return useSuspenseQuery(getAppUpdateOptions());
};
