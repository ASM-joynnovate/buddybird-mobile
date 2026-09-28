import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { getDeviceList, putDevice } from '@/apis/devices';

import type { RegisterDeviceRequest } from '@/types/apis/devices';

import { apiKeys } from '@/hooks/apis/keys';

export const devicesQueryOptions = () => queryOptions({ queryKey: apiKeys.devices(), queryFn: getDeviceList });

export const registerDeviceMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('devices', 'register'),
		mutationFn: ({ device, idempotencyKey }: { device: RegisterDeviceRequest; idempotencyKey: string }) =>
			putDevice({ data: device, idempotencyKey }),
	});
