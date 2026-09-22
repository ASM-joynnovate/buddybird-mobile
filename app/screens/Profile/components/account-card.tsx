import { useTranslation } from "react-i18next"
import { Image, StyleSheet, View } from "react-native"

import { Icon } from "@/components/ui/icon"
import { PressableSurface } from "@/components/ui/surface"
import { Copy, Title } from "@/components/ui/text"
import { colors } from "@/theme"
import type { User } from "@/types/apis/users"

export function AccountCard({ user, onPress }: { user: User; onPress(): void }) {
	const { t } = useTranslation()
	const nickname = user.nickname ?? t("profile.nicknameMissing")

	return (
		<PressableSurface
			accessibilityLabel={[t("profile.editAccount"), nickname, user.email]
				.filter(Boolean)
				.join(", ")}
			onPress={onPress}
			contentStyle={styles.card}
		>
			<View style={styles.photo}>
				{user.photo ? (
					<Image source={{ uri: user.photo.url }} style={styles.image} />
				) : (
					<Icon name="profile" size={34} color={colors.disabled} />
				)}
			</View>
			<View style={styles.lines}>
				<Title style={[styles.nickname, !user.nickname && styles.missing]}>
					{nickname}
				</Title>
				{user.email ? (
					<Copy style={styles.email} numberOfLines={1}>
						{user.email}
					</Copy>
				) : null}
			</View>
			<Icon name="forward" size={18} color={colors.disabled} />
		</PressableSurface>
	)
}

const styles = StyleSheet.create({
	card: { flexDirection: "row", alignItems: "center", gap: 16, padding: 20 },
	photo: {
		width: 80,
		height: 80,
		borderRadius: 40,
		overflow: "hidden",
		backgroundColor: colors.surface,
		alignItems: "center",
		justifyContent: "center",
	},
	image: { width: "100%", height: "100%" },
	lines: { flex: 1, minWidth: 0, gap: 4 },
	nickname: { fontSize: 22, lineHeight: 28 },
	missing: { color: colors.orangeDark, fontSize: 18, lineHeight: 24 },
	email: { fontSize: 14, color: colors.muted },
})
