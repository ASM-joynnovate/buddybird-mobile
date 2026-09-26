import { useState } from "react"

import { disconnectDeviceMutationOptions, renameDeviceMutationOptions } from "@/hooks/apis/mocks"
import { useIdempotentMutation } from "@/hooks/apis/use-idempotent-mutation"
import type { LinkedDevice } from "@/types/device"

type Target = { kind: "rename" | "disconnect"; device: LinkedDevice } | null

export type DeviceActionState = { busy: boolean; failed: boolean }

export interface DeviceActions {
	target: Target
	open(kind: "rename" | "disconnect", device: LinkedDevice): void
	close(): void
	rename: DeviceActionState & { save(name: string): void }
	disconnect: DeviceActionState & { confirm(): void }
}

export function useDeviceActions(): DeviceActions {
	const renaming = useIdempotentMutation(renameDeviceMutationOptions())
	const disconnecting = useIdempotentMutation(disconnectDeviceMutationOptions())

	const [target, setTarget] = useState<Target>(null)

	function close() {
		renaming.reset()
		disconnecting.reset()

		setTarget(null)
	}

	return {
		target,
		open: (kind, device) => setTarget({ kind, device }),
		close,
		rename: {
			busy: renaming.isPending,
			failed: renaming.isError,
			save: (name) => {
				if (target) {
					renaming.mutate(
						{ id: target.device.id, name: name.trim() || null },
						{ onSuccess: close },
					)
				}
			},
		},
		disconnect: {
			busy: disconnecting.isPending,
			failed: disconnecting.isError,
			confirm: () => {
				if (target) {
					disconnecting.mutate({ id: target.device.id }, { onSuccess: close })
				}
			},
		},
	}
}
