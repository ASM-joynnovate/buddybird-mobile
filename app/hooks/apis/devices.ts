import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getDeviceList, putDevice } from '@/apis/devices';

import { apiKeys } from '@/hooks/apis/keys';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

/** 기기 목록 조회 옵션 */
export const getDeviceListOptions = () => queryOptions({ queryKey: apiKeys.devices(), queryFn: getDeviceList });
/** 기기 목록 조회 훅 */
export const useGetDeviceList = () => {
	return useSuspenseQuery(getDeviceListOptions());
};

/** 기기 등록 훅 */
export const useRegisterDevice = () => {
	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('devices', 'register'),
		mutationFn: putDevice,
	});
};
