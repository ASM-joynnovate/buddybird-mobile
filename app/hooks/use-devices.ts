import { useQuery } from '@tanstack/react-query';

import type { LinkedDevice } from '@/types/device';

import { devicesQueryOptions } from '@/hooks/apis/devices';
import { runningSessionQueryOptions } from '@/hooks/apis/sessions';

import { useAccountStore } from '@/stores/account';
import { linkDevices } from '@/utils/device';

export function useDevices(): {
	devices: LinkedDevice[] | undefined;
	isError: boolean;
	retry(): void;
} {
	const devices = useQuery(devicesQueryOptions());
	const running = useQuery(runningSessionQueryOptions());

	const linkedDevices = devices.data
		? linkDevices(devices.data, useAccountStore.getState().ensureClientDeviceId(), running.data ?? null)
		: undefined;

	return {
		devices: linkedDevices,
		isError: devices.isError,
		retry: () => {
			void devices.refetch();
		},
	};
}
