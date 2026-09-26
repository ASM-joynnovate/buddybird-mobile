import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { IconButton } from "@/components/ui/icon-button"
import { Card } from "@/components/ui/surface"
import { Tag } from "@/components/ui/tag"
import { Copy } from "@/components/ui/text"
import { formatMoment } from "@/i18n/format"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { colors, font } from "@/theme"
import type { LinkedDevice } from "@/types/device"

export function deviceName(device: LinkedDevice): string {
	return device.name ?? device.model
}

interface Props {
	device: LinkedDevice
	onRename(): void
	onDisconnect(): void
}

export function DeviceCard({ device, onRename, onDisconnect }: Props) {
	const { t } = useTranslation()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const name = deviceName(device)

	return (
		<Card contentStyle={styles.card}>
			<View style={styles.lines}>
				<Copy style={styles.name} numberOfLines={1}>
					{name}
				</Copy>
				{device.name ? <Copy style={styles.detail}>{device.model}</Copy> : null}
				{device.lastSeenAt ? (
					<Copy style={styles.detail}>
						{t("settings.devices.lastSeen", {
							time: formatMoment(device.lastSeenAt, locale),
						})}
					</Copy>
				) : null}
				{device.isThisDevice || device.isRunningSession ? (
					<View style={styles.tags}>
						{device.isThisDevice ? <Tag label={t("settings.devices.current")} /> : null}
						{device.isRunningSession ? (
							<Tag tone="primary" label={t("settings.devices.running")} />
						) : null}
					</View>
				) : null}
			</View>
			<View style={styles.actions}>
				<IconButton
					icon="edit"
					variant="muted"
					size="small"
					label={t("settings.devices.rename", { name })}
					onPress={onRename}
				/>
				{device.isThisDevice ? null : (
					<IconButton
						icon="close"
						variant="muted"
						size="small"
						label={t("settings.devices.disconnect", { name })}
						onPress={onDisconnect}
					/>
				)}
			</View>
		</Card>
	)
}

const styles = StyleSheet.create({
	card: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
	lines: { flex: 1, minWidth: 0, gap: 2 },
	name: { fontFamily: font.black, fontSize: 18, lineHeight: 24 },
	detail: { fontSize: 13, color: colors.muted },
	tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
	actions: { flexDirection: "row", marginRight: -8, marginTop: -8 },
})
