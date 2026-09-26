import * as Notifications from "expo-notifications"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { registerPushTokenMutationOptions } from "@/hooks/apis/devices"
import { useIdempotentMutation } from "@/hooks/apis/use-idempotent-mutation"
import { type PermissionKind, requestPermission } from "@/services/device/permissions"
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
	error: string | null
	allow(): void
	later(): void
} {
	const { t } = useTranslation()

	const register = useIdempotentMutation(registerPushTokenMutationOptions())

	const [busy, setBusy] = useState(false)
	const [error, setError] = useState<string | null>(null)

	function finish() {
		try {
			useDeviceSettingsStore.getState().setGuideSeen("usage", true)
		} catch (cause) {
			reportError(cause, "usage_guide_seen")

			setError(t("entry.permissions.saveError"))
		}
	}

	async function registerPush() {
		try {
			const { data } = await Notifications.getDevicePushTokenAsync()

			await register.mutateAsync({ token: String(data) })
		} catch (cause) {
			reportError(cause, "push_token_register")
		}
	}

	async function allow() {
		if (busy) {
			return
		}

		setBusy(true)
		setError(null)

		for (const kind of ORDER) {
			const granted = await ask(kind)

			if (kind === "notifications" && granted) {
				void registerPush()
			}
		}

		setBusy(false)

		finish()
	}

	return { busy, error, allow: () => void allow(), later: finish }
}
