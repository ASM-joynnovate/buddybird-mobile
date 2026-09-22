import { useQuery } from "@tanstack/react-query"

import { devicesQueryOptions } from "@/hooks/apis/devices"
import { deviceNamesQueryOptions } from "@/hooks/apis/mocks"
import { runningSessionQueryOptions } from "@/hooks/apis/sessions"
import { useAccountStore } from "@/stores/account"
import type { LinkedDevice } from "@/types/device"
import { linkDevices } from "@/utils/device"

export function useDevices(): {
	devices: LinkedDevice[] | undefined
	isError: boolean
	retry(): void
} {
	const devices = useQuery(devicesQueryOptions())
	const names = useQuery(deviceNamesQueryOptions())
	const running = useQuery(runningSessionQueryOptions())

	const linkedDevices =
		devices.data && names.data
			? linkDevices(
					devices.data,
					new Map(names.data.map((item) => [item.device_id, item.name])),
					useAccountStore.getState().ensureClientDeviceId(),
					running.data ?? null,
				)
			: undefined

	return {
		devices: linkedDevices,
		isError: devices.isError || names.isError,
		retry: () => {
			void devices.refetch()
			void names.refetch()
		},
	}
}
