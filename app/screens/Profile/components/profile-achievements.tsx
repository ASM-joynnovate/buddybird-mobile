import { useTranslation } from "react-i18next"

import { StyleSheet, View } from "react-native"

import { Card } from "@/components/ui/surface"

import { Icon } from "@/components/ui/icon"
import { Copy } from "@/components/ui/text"
import { durationText } from "@/i18n/duration"
import { profileStats } from "@/services/profile/statistics"
import { colors, font, radius } from "@/theme"
import type { Locale } from "@/types/locale"

export function ProfileAchievements({
	stats,
	locale,
}: {
	stats: ReturnType<typeof profileStats>
	locale: Locale
}) {
	const { t } = useTranslation()
	const achievements = [
		{
			value: t("profile.streakCount", { count: stats.streakDays }),
			label: t("profile.flame"),
			unlocked: stats.streakDays > 0,
			icon: "flame" as const,
			color: colors.orange,
			backgroundColor: colors.orangeSoft,
		},
		{
			value: durationText(stats.todaySeconds, locale),
			label: t("profile.todayAchievement"),
			unlocked: stats.todaySeconds > 0,
			icon: "clock" as const,
			color: colors.orange,
			backgroundColor: colors.orangeSoft,
		},
		{
			value: durationText(stats.totalSeconds, locale),
			label: t("profile.totalAchievement"),
			unlocked: stats.totalSeconds > 0,
			icon: "clock" as const,
			color: colors.blue,
			backgroundColor: colors.blueSoft,
		},
		{
			value: t("profile.report"),
			label: t("profile.comingSoon"),
			unlocked: false,
			icon: "lock" as const,
			color: colors.muted,
			backgroundColor: colors.surface,
		},
	]

	return (
		<View style={styles.achievements}>
			{achievements.map((item) => (
				<Card
					key={item.label}
					style={styles.cell}
					contentStyle={[styles.achievement, !item.unlocked && styles.locked]}
				>
					<View
						style={[
							styles.achievementBadge,
							{
								backgroundColor: item.unlocked
									? item.backgroundColor
									: colors.surface,
							},
						]}
					>
						<Icon
							name={item.unlocked ? item.icon : "lock"}
							color={item.unlocked ? item.color : colors.muted}
							size={26}
						/>
					</View>
					<View style={styles.achievementText}>
						<Copy style={styles.achievementValue}>{item.value}</Copy>
						<Copy style={styles.achievementLabel}>{item.label}</Copy>
					</View>
				</Card>
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	achievements: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
	cell: { width: "48%" },
	achievement: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		minHeight: 90,
		padding: 14,
	},
	achievementBadge: {
		width: 36,
		height: 40,
		borderRadius: radius.card / 2,
		alignItems: "center",
		justifyContent: "center",
	},
	locked: { backgroundColor: colors.surface },
	achievementText: { flex: 1 },
	achievementValue: { fontFamily: font.extraBold, fontSize: 16 },
	achievementLabel: { fontSize: 12, color: colors.muted, marginTop: 4 },
})
