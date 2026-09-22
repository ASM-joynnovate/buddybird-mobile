import type { Device } from "@/types/apis/devices"
import type { Session } from "@/types/apis/sessions"
import type { LinkedDevice } from "@/types/device"

export function linkDevices(
	devices: readonly Device[],
	names: ReadonlyMap<string, string | null>,
	clientDeviceId: string,
	running: Session | null,
): LinkedDevice[] {
	return devices.map((device) => ({
		id: device.id,
		name: names.get(device.id) ?? null,
		model: device.client.model,
		lastSeenAt: device.last_seen_at,
		isThisDevice: device.client_device_id === clientDeviceId,
		isRunningSession: running?.station.device_id === device.id,
	}))
}
