import { queryOptions } from '@tanstack/react-query';

import { getAppUpdate } from '@/apis/app-update';

import { apiKeys } from '@/hooks/apis/keys';

export const appUpdateQueryOptions = () =>
	queryOptions({
		queryKey: apiKeys.appUpdate(),
		queryFn: getAppUpdate,
		retry: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});
