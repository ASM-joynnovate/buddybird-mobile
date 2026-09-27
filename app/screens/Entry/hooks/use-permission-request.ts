import { useState } from "react"

import { type PermissionKind, requestPermission } from "@/services/device/permissions"
import { sendPushToken } from "@/services/push/registration"
import { reportError } from "@/services/telemetry/client"
import { useDeviceSettingsStore } from "@/stores/device-settings"

const ORDER: readonly PermissionKind[] = ["microphone", "notifications"]

async function ask(kind: PermissionKind) {
	try {
		return (await requestPermission(kind)).granted
	} catch (error) {
		reportError(error, `permission_request_${kind}`)

		return false
	}
}

export function usePermissionRequest(): {
	busy: boolean
	allow(): void
	later(): void
} {
	const [busy, setBusy] = useState(false)

	function finish() {
		try {
			useDeviceSettingsStore.getState().setOnboardingCompleted(true)
		} catch (cause) {
			reportError(cause, "onboarding_completed_save")
		}
	}

	async function allow() {
		if (busy) {
			return
		}

		setBusy(true)

		for (const kind of ORDER) {
			const granted = await ask(kind)

			if (kind === "notifications" && granted) {
				void sendPushToken().catch((cause) => reportError(cause, "push_token_register"))
			}
		}

		setBusy(false)

		finish()
	}

	return { busy, allow: () => void allow(), later: finish }
}
