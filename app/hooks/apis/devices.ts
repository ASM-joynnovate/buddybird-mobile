import { queryOptions, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

import { deleteDevice, getDeviceList, putDevice, putPushToken } from '@/apis/devices';

import { apiKeys } from '@/hooks/apis/keys';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { reportError } from '@/services/telemetry/client';

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

/** 기기 삭제 Hook */
export const useDeleteDevice = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('devices', 'delete'),
		mutationFn: deleteDevice,
		onSuccess: () =>
			Promise.all([
				queryClient.invalidateQueries({ queryKey: apiKeys.devices() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.sessions.running() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.home() }),
			]),
		onError: (error) => reportError(error, 'device_delete'),
	});
};
