import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import type { Device } from "@/apis/devices"
import { IconButton } from "@/components/ui/icon-button"
import { Card } from "@/components/ui/surface"
import { Tag } from "@/components/ui/tag"
import { Copy } from "@/components/ui/text"
import { formatMoment } from "@/i18n/format"
import { colors, font } from "@/theme"
import type { Locale } from "@/types/locale"

export function deviceName(device: Device): string {
	return device.name ?? device.model
}

export function DeviceCard({
	device,
	locale,
	onRename,
	onDisconnect,
}: {
	device: Device
	locale: Locale
	onRename(): void
	onDisconnect(): void
}) {
	const { t } = useTranslation()
	const name = deviceName(device)

	return (
		<Card contentStyle={styles.card}>
			<View style={styles.lines}>
				<Copy style={styles.name} numberOfLines={1}>
					{name}
				</Copy>
				{device.name ? <Copy style={styles.detail}>{device.model}</Copy> : null}
				{device.last_seen_at ? (
					<Copy style={styles.detail}>
						{t("settings.devices.lastSeen", {
							time: formatMoment(device.last_seen_at, locale),
						})}
					</Copy>
				) : null}
				{device.is_current || device.is_running_session ? (
					<View style={styles.tags}>
						{device.is_current ? <Tag label={t("settings.devices.current")} /> : null}
						{device.is_running_session ? (
							<Tag tone="primary" label={t("settings.devices.running")} />
						) : null}
					</View>
				) : null}
			</View>
			<View style={styles.actions}>
				<IconButton
					icon="edit"
					iconSize={20}
					color={colors.muted}
					label={t("settings.devices.rename", { name })}
					onPress={onRename}
				/>
				{device.is_current ? null : (
					<IconButton
						icon="close"
						iconSize={20}
						color={colors.muted}
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
