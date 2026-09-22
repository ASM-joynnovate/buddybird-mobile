import { useCallback, useEffect, useRef, useState } from "react"
import { AppState } from "react-native"

import {
	type PermissionKind,
	type PermissionState,
	readPermission,
	requestPermission,
} from "@/services/device/permissions"
import { reportError } from "@/services/telemetry/client"

export type PermissionDialogState = { visible: boolean; kind: PermissionKind; onClose(): void }

export function usePermission(kind: PermissionKind) {
	const [state, setState] = useState<PermissionState | null>(null)
	const [dialogOpen, setDialogOpen] = useState(false)
	const pending = useRef<(() => void) | null>(null)

	const refresh = useCallback(async () => {
		const next = await readPermission(kind)

		setState(next)

		return next
	}, [kind])

	useEffect(() => {
		void refresh().catch((error: unknown) => reportError(error, `permission_${kind}`))

		const subscription = AppState.addEventListener("change", (status) => {
			if (status !== "active") {
				return
			}

			void refresh()
				.then((next) => {
					const action = pending.current

					if (next.granted && action) {
						pending.current = null
						setDialogOpen(false)
						action()
					}
				})
				.catch((error: unknown) => reportError(error, `permission_${kind}`))
		})

		return () => subscription.remove()
	}, [kind, refresh])

	const run = useCallback(
		async (action: () => void) => {
			const current = await readPermission(kind)

			if (current.granted) {
				action()

				return
			}

			if (current.canAskAgain) {
				const next = await requestPermission(kind)

				setState(next)

				if (next.granted) {
					action()
				}

				return
			}

			pending.current = action
			setDialogOpen(true)
		},
		[kind],
	)

	const dialog: PermissionDialogState = {
		visible: dialogOpen,
		kind,
		onClose: () => {
			pending.current = null
			setDialogOpen(false)
		},
	}

	return { granted: state?.granted ?? null, refresh, run, dialog }
}
