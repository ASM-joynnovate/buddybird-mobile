import { useQuery } from '@tanstack/react-query';

import type { LinkedDevice } from '@/types/device';

import { getDeviceListOptions } from '@/hooks/apis/devices';
import { getRunningSessionOptions } from '@/hooks/apis/sessions';

import { useAccountStore } from '@/stores/account';
import { linkDevices } from '@/utils/device';

export function useDevices(): {
	devices: LinkedDevice[] | undefined;
	isError: boolean;
	retry(): void;
} {
	const { data: deviceListData, isError, refetch } = useQuery(getDeviceListOptions());
	const { data: runningSessionData } = useQuery(getRunningSessionOptions());

	const linkedDevices = deviceListData
		? linkDevices(deviceListData, useAccountStore.getState().ensureClientDeviceId(), runningSessionData ?? null)
		: undefined;

	return {
		devices: linkedDevices,
		isError,
		retry: () => {
			void refetch();
		},
	};
}
