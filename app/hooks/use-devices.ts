import type { LinkedDevice } from '@/types/device';

import { useGetDeviceList } from '@/hooks/apis/devices';
import { useGetRunningSession } from '@/hooks/apis/sessions';

import { useAccountStore } from '@/stores/account';
import { linkDevices } from '@/utils/device';

export function useDevices(): {
	linkedDevices: LinkedDevice[];
} {
	const { data: deviceListData } = useGetDeviceList();
	const { data: runningSessionData } = useGetRunningSession();

	const clientDeviceId = useAccountStore((state) => state.clientDeviceId);

	const linkedDevices = linkDevices(deviceListData, clientDeviceId, runningSessionData);

	return { linkedDevices };
}
