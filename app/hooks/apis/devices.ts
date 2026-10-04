import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getDeviceList, putDevice, putPushToken } from '@/apis/devices';

import { apiKeys } from '@/hooks/apis/keys';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

/** 기기 목록 조회 Hook에 사용할 옵션 */
export const getDeviceListOptions = () => queryOptions({ queryKey: apiKeys.devices(), queryFn: getDeviceList });
/** 기기 목록 조회 Hook */
export const useGetDeviceList = () => {
	return useSuspenseQuery(getDeviceListOptions());
};

/** 기기 등록 Hook */
export const useRegisterDevice = () => {
	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('devices', 'register'),
		mutationFn: putDevice,
	});
};

/** 푸시 토큰 저장 Hook */
export const useUpdatePushToken = () => {
	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('devices', 'me', 'push-token', 'update'),
		mutationFn: putPushToken,
	});
};
