import { useTranslation } from "react-i18next"

import { StyleSheet, View } from "react-native"

import { Card } from "@/components/ui/surface"

import { Icon, IconName } from "@/components/ui/icon"
import { Copy } from "@/components/ui/text"
import { durationText } from "@/i18n/duration"
import { profileStats } from "@/services/profile/statistics"
import { colors, font } from "@/theme"
import type { Locale } from "@/types/locale"

export function ProfileStatistics({
	stats,
	locale,
}: {
	stats: ReturnType<typeof profileStats>
	locale: Locale
}) {
	const { t } = useTranslation()
	const summaries: { icon: IconName; value: string; label: string; color: string }[] = [
		{
			icon: "flame",
			value: String(stats.streakDays),
			label: t("profile.streak"),
			color: colors.orange,
		},
		{
			icon: "clock",
			value: durationText(stats.todaySeconds, locale),
			label: t("profile.today"),
			color: colors.orange,
		},
		{
			icon: "clock",
			value: durationText(stats.totalSeconds, locale),
			label: t("profile.total"),
			color: colors.blue,
		},
	]

	return (
		<View style={styles.summaries}>
			{summaries.map((item) => (
				<Card key={item.label} style={styles.cell} contentStyle={styles.summary}>
					<Icon name={item.icon} color={item.color} size={28} />
					<Copy style={styles.stat}>{item.value}</Copy>
					<Copy style={styles.statLabel}>{item.label}</Copy>
				</Card>
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	summaries: { flexDirection: "row", gap: 10, marginTop: 24 },
	cell: { flex: 1 },
	summary: { alignItems: "center", paddingHorizontal: 7, paddingVertical: 18, gap: 8 },
	stat: { fontSize: 25, fontFamily: font.black, textAlign: "center" },
	statLabel: { fontSize: 11, textAlign: "center", color: colors.muted },
})
