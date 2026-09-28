import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { fetchDevices, registerDevice } from '@/apis/devices';

import type { RegisterDeviceRequest } from '@/types/apis/devices';

import { apiKeys } from '@/hooks/apis/keys';

export const devicesQueryOptions = () => queryOptions({ queryKey: apiKeys.devices(), queryFn: fetchDevices });

export const registerDeviceMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('devices', 'register'),
		mutationFn: ({ device, idempotencyKey }: { device: RegisterDeviceRequest; idempotencyKey: string }) =>
			registerDevice(device, idempotencyKey),
	});
