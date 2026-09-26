import { useTranslation } from "react-i18next"

import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { Copy } from "@/components/ui/text"
import { deviceName } from "@/screens/Settings/components/device-card"
import type { DeviceActionState } from "@/screens/Settings/hooks/use-device-actions"
import type { LinkedDevice } from "@/types/device"

interface Props {
	device: LinkedDevice
	state: DeviceActionState
	onConfirm(): void
	onClose(): void
}

export function DisconnectDeviceDialog({ device, state, onConfirm, onClose }: Props) {
	const { t } = useTranslation()

	return (
		<ConfirmDialog
			visible
			text={{
				title: t("settings.devices.disconnect", { name: deviceName(device) }),
				message: t("settings.devices.disconnectMessage"),
				confirm: t("settings.devices.disconnectConfirm"),
			}}
			state={{
				busy: state.busy,
				error: state.failed ? t("settings.devices.disconnectError") : null,
			}}
			onClose={onClose}
			onConfirm={onConfirm}
		>
			{device.isRunningSession ? <Copy>{t("settings.devices.sessionEnds")}</Copy> : null}
		</ConfirmDialog>
	)
}
