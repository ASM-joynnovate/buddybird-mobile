import { memo } from "react"
import { useTranslation } from "react-i18next"
import { Image, StyleSheet, View } from "react-native"

import { DotBadge } from "@/components/ui/dot-badge"
import { Icon, type IconName } from "@/components/ui/icon"
import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { formatMoment } from "@/i18n/format"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { colors, font, radius } from "@/theme"
import type { AppNotification, NotificationKind } from "@/types/apis/notifications"
import { joinLabel } from "@/utils/a11y"

const icons: Record<NotificationKind, IconName> = {
	mimicry: "mimicry",
	daily_summary: "report",
	streak: "flame",
}

interface Props {
	item: AppNotification
	onOpen(item: AppNotification): void
}

export const NotificationItem = memo(function NotificationItem({ item, onOpen }: Props) {
	const { t } = useTranslation()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const unread = !item.read_at
	const time = formatMoment(item.sent_at, locale)

	return (
		<PressableSurface
			tone="plain"
			depth={0}
			cornerRadius={0}
			style={styles.item}
			contentStyle={styles.row}
			accessibilityLabel={joinLabel(
				unread && t("home.notification.unread"),
				item.title,
				item.body,
				time,
			)}
			onPress={() => onOpen(item)}
		>
			<View style={styles.icon}>
				<Icon name={icons[item.kind]} size={20} color={colors.orangeDark} />
			</View>
			<View style={styles.text}>
				<View style={styles.titleRow}>
					<Copy numberOfLines={1} style={styles.title}>
						{item.title}
					</Copy>
					{unread ? <DotBadge /> : null}
				</View>
				<Copy numberOfLines={2} style={styles.body}>
					{item.body}
				</Copy>
				<Copy style={styles.time}>{time}</Copy>
			</View>
			{item.image ? (
				<Image
					source={{ uri: item.image.url }}
					style={styles.image}
					accessibilityIgnoresInvertColors
				/>
			) : null}
		</PressableSurface>
	)
})

const styles = StyleSheet.create({
	item: { borderBottomWidth: 2, borderBottomColor: colors.border },
	row: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 12,
		paddingVertical: 12,
		paddingHorizontal: 2,
	},
	icon: {
		width: 36,
		height: 36,
		borderRadius: radius.control,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.orangeSelected,
	},
	text: { flex: 1, minWidth: 0, gap: 3 },
	titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
	title: { flexShrink: 1, fontFamily: font.black, fontSize: 16, color: colors.text },
	body: { fontSize: 14, color: colors.text },
	time: { fontSize: 12, color: colors.muted },
	image: {
		width: 64,
		height: 64,
		borderRadius: radius.control,
		backgroundColor: colors.surface,
	},
})
