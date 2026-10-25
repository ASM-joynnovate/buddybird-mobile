import { queryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { getAppUpdate } from '@/apis/app-update';

import { appUpdateKeys } from '@/hooks/apis/keys/app-update';

/** 앱 업데이트 정보 조회 Hook에 사용할 옵션 */
export const getAppUpdateOptions = () =>
	queryOptions({
		queryKey: appUpdateKeys.all(),
		queryFn: getAppUpdate,
		retry: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		meta: { authorizationOmitted: true },
	});
/** 앱 업데이트 정보 조회 Hook */
export const useGetAppUpdate = () => {
	return useSuspenseQuery(getAppUpdateOptions());
};
/** suspense 없는 앱 업데이트 정보 조회 Hook */
export const useGetAppUpdateQuery = () => {
	return useQuery(getAppUpdateOptions());
};
