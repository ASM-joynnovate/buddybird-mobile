import { useMutation } from "@tanstack/react-query"
import { randomUUID } from "expo-crypto"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import type { Device } from "@/apis/devices"
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { Dialog } from "@/components/dialogs/dialog"
import { Button } from "@/components/ui/button"
import { InlineError } from "@/components/ui/inline-error"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"
import { TextField } from "@/components/ui/text-field"
import { disconnectDeviceMutationOptions, renameDeviceMutationOptions } from "@/hooks/apis/devices"
import { deviceName } from "@/screens/Settings/components/device-card"

const MAX_DEVICE_NAME = 30

export function RenameDeviceDialog({ device, onClose }: { device: Device; onClose(): void }) {
	const { t } = useTranslation()
	const mutation = useMutation(renameDeviceMutationOptions())
	const [name, setName] = useState(device.name ?? "")

	function save() {
		mutation.mutate(
			{ id: device.id, name: name.trim() || null, idempotencyKey: randomUUID() },
			{ onSuccess: onClose },
		)
	}

	return (
		<Dialog
			visible
			title={t("settings.devices.renameTitle")}
			onClose={mutation.isPending ? () => {} : onClose}
			footer={
				<View style={ui.actions}>
					<Button
						label={t("common.cancel")}
						variant="secondary"
						compact
						disabled={mutation.isPending}
						onPress={onClose}
						style={ui.action}
					/>
					<Button
						label={t("common.save")}
						compact
						loading={mutation.isPending}
						onPress={save}
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
				editable={!mutation.isPending}
				autoFocus
				returnKeyType="done"
				onSubmitEditing={save}
			/>
			<InlineError message={mutation.isError ? t("settings.devices.renameError") : null} />
		</Dialog>
	)
}

export function DisconnectDeviceDialog({ device, onClose }: { device: Device; onClose(): void }) {
	const { t } = useTranslation()
	const mutation = useMutation(disconnectDeviceMutationOptions())

	return (
		<ConfirmDialog
			visible
			title={t("settings.devices.disconnect", { name: deviceName(device) })}
			message={t("settings.devices.disconnectMessage")}
			confirmLabel={t("settings.devices.disconnectConfirm")}
			cancelLabel={t("common.cancel")}
			busy={mutation.isPending}
			error={mutation.isError ? t("settings.devices.disconnectError") : null}
			onClose={onClose}
			onConfirm={() =>
				mutation.mutate(
					{ id: device.id, idempotencyKey: randomUUID() },
					{ onSuccess: onClose },
				)
			}
		>
			{device.is_running_session ? <Copy>{t("settings.devices.sessionEnds")}</Copy> : null}
		</ConfirmDialog>
	)
}
