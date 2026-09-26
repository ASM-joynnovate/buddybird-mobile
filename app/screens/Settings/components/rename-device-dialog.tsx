import { useState } from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Dialog } from "@/components/dialogs/dialog"
import { Button } from "@/components/ui/button"
import { InlineError } from "@/components/ui/inline-error"
import { ui } from "@/components/ui/styles"
import { TextField } from "@/components/ui/text-field"
import { MAX_DEVICE_NAME } from "@/mocks/types"
import type { DeviceActionState } from "@/screens/Settings/hooks/use-device-actions"
import type { LinkedDevice } from "@/types/device"

interface Props {
	device: LinkedDevice
	state: DeviceActionState
	onSave(name: string): void
	onClose(): void
}

export function RenameDeviceDialog({ device, state, onSave, onClose }: Props) {
	const { t } = useTranslation()

	const [name, setName] = useState(device.name ?? "")

	return (
		<Dialog
			visible
			title={t("settings.devices.renameTitle")}
			onClose={state.busy ? () => {} : onClose}
			footer={
				<View style={ui.actions}>
					<Button
						label={t("common.cancel")}
						variant="secondary"
						compact
						disabled={state.busy}
						onPress={onClose}
						style={ui.action}
					/>
					<Button
						label={t("common.save")}
						compact
						loading={state.busy}
						onPress={() => onSave(name)}
						style={ui.action}
					/>
				</View>
			}
		>
			<TextField
				label={t("settings.devices.nameLabel")}
				value={name}
				onChangeText={setName}
				placeholder={device.model}
				maxLength={MAX_DEVICE_NAME}
				editable={!state.busy}
				autoFocus
				returnKeyType="done"
				onSubmitEditing={() => onSave(name)}
			/>
			<InlineError message={state.failed ? t("settings.devices.renameError") : null} />
		</Dialog>
	)
}
