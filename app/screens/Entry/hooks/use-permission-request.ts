import { useMutation } from "@tanstack/react-query"
import { randomUUID } from "expo-crypto"
import * as Notifications from "expo-notifications"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { registerPushTokenMutationOptions } from "@/hooks/apis/devices"
import { useDeviceSetting } from "@/hooks/use-device-setting"
import { type PermissionKind, requestPermission } from "@/services/device/permissions"
import { saveDeviceSetting } from "@/services/storage/device-settings"
import { reportError } from "@/services/telemetry/client"

const ORDER: readonly PermissionKind[] = ["microphone", "camera", "notifications"]

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
	const guides = useDeviceSetting("guides")
	const register = useMutation(registerPushTokenMutationOptions())
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState<string | null>(null)

	function finish() {
		try {
			saveDeviceSetting("guides", { ...guides, usage: true })
		} catch (cause) {
			reportError(cause, "usage_guide_seen")
			setError(t("entry.permissions.saveError"))
		}
	}

	async function registerPush() {
		try {
			const { data } = await Notifications.getDevicePushTokenAsync()

			await register.mutateAsync({ token: String(data), idempotencyKey: randomUUID() })
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
