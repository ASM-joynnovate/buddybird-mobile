import { useTranslation } from "react-i18next"
import { Image, StyleSheet, View } from "react-native"

import { CountBadge } from "@/components/ui/badge"
import { IconButton } from "@/components/ui/icon-button"
import { Title } from "@/components/ui/text"
import { colors, mascot } from "@/theme"

export function HomeTopBar({
	streak,
	unread,
	onNotifications,
	onSettings,
}: {
	streak: number
	unread: number
	onNotifications(): void
	onSettings(): void
}) {
	const { t } = useTranslation()

	return (
		<View style={styles.bar}>
			<Image
				source={mascot}
				style={styles.face}
				accessibilityIgnoresInvertColors
				accessible={false}
			/>
			<Title style={styles.brand}>{t("home.brand")}</Title>
			{streak > 0 ? (
				<CountBadge
					count={streak}
					icon="flame"
					label={t("home.streak", { count: streak })}
				/>
			) : null}
			<View>
				<IconButton
					icon="bell"
					label={
						unread > 0
							? t("home.notificationsUnread", { count: unread })
							: t("home.notifications")
					}
					color={colors.muted}
					onPress={onNotifications}
				/>
				{unread > 0 ? (
					<View
						style={styles.badge}
						pointerEvents="none"
						accessibilityElementsHidden
						importantForAccessibility="no-hide-descendants"
					>
						<CountBadge count={unread} tone="danger" label="" />
					</View>
				) : null}
			</View>
			<IconButton
				icon="gear"
				label={t("home.settings")}
				color={colors.muted}
				onPress={onSettings}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	bar: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 48 },
	face: { width: 34, height: 34 },
	brand: { flex: 1, minWidth: 0, fontSize: 20, lineHeight: 26 },
	badge: { position: "absolute", top: -2, right: -4 },
})
