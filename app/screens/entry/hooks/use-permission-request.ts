import { useState } from "react"

import {
	type PermissionKind,
	readPermission,
	requestPermission,
} from "@/services/device/permissions"
import { sendPushToken } from "@/services/push/registration"
import { reportError } from "@/services/telemetry/client"
import { completeOnboarding, completeOnboardingStep } from "@/services/telemetry/onboarding"
import { useDeviceSettingsStore } from "@/stores/device-settings"

async function ask(kind: PermissionKind) {
	try {
		return (await requestPermission(kind)).granted
	} catch (error) {
		reportError(error, `permission_request_${kind}`)

		return false
	}
}

async function isGranted(kind: PermissionKind) {
	try {
		return (await readPermission(kind)).granted
	} catch (error) {
		reportError(error, `permission_read_${kind}`)

		return false
	}
}

export function usePermissionRequest(): {
	busy: boolean
	allow(): void
	later(): void
} {
	const [busy, setBusy] = useState(false)

	function finish(microphoneGranted: boolean, notificationsGranted: boolean) {
		completeOnboardingStep("permissions", {
			microphone_granted: microphoneGranted,
			notifications_granted: notificationsGranted,
		})
		completeOnboarding()

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

		const microphoneGranted = await ask("microphone")
		const notificationsGranted = await ask("notifications")

		if (notificationsGranted) {
			void sendPushToken().catch((cause) => reportError(cause, "push_token_register"))
		}

		setBusy(false)

		finish(microphoneGranted, notificationsGranted)
	}

	async function later() {
		finish(await isGranted("microphone"), await isGranted("notifications"))
	}

	return { busy, allow: () => void allow(), later: () => void later() }
}
