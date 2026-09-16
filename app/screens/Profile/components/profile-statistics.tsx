import { Fragment, ReactNode } from "react"

import { useTranslation } from "react-i18next"

import { StyleSheet, useWindowDimensions, View } from "react-native"

import { Card } from "@/components/ui/surface"

import { Icon, IconName } from "@/components/ui/icon"
import { Copy } from "@/components/ui/text"
import { durationParts } from "@/i18n/duration"
import { profileStats } from "@/services/profile/statistics"
import { colors, font } from "@/theme"
import type { Locale } from "@/types/locale"

function DurationValue({
	seconds,
	locale,
	compact,
}: {
	seconds: number
	locale: Locale
	compact: boolean
}) {
	const parts = durationParts(seconds, locale)
	const rows = Math.round(seconds) >= 3600 ? [parts.slice(0, 1), parts.slice(1)] : [parts]

	return rows
		.filter((row) => row.length > 0)
		.map((row) => (
			<Copy key={row[0].unit} style={[styles.stat, compact && styles.compactStat]}>
				{row.map(({ value, unit }, index) => (
					<Fragment key={unit}>
						{index > 0 ? " " : null}
						{value}
						<Copy style={[styles.unit, compact && styles.compactUnit]}>{unit}</Copy>
					</Fragment>
				))}
			</Copy>
		))
}

export function ProfileStatistics({
	stats,
	locale,
}: {
	stats: ReturnType<typeof profileStats>
	locale: Locale
}) {
	const { t } = useTranslation()
	const { width } = useWindowDimensions()
	const compact = width < 360
	const summaries: { icon: IconName; value: ReactNode; label: string; color: string }[] = [
		{
			icon: "flame",
			value: (
				<Copy style={[styles.stat, compact && styles.compactStat]}>{stats.streakDays}</Copy>
			),
			label: t("profile.streak"),
			color: colors.orange,
		},
		{
			icon: "clock",
			value: <DurationValue seconds={stats.todaySeconds} locale={locale} compact={compact} />,
			label: t("profile.today"),
			color: colors.orange,
		},
		{
			icon: "clock",
			value: <DurationValue seconds={stats.totalSeconds} locale={locale} compact={compact} />,
			label: t("profile.total"),
			color: colors.blue,
		},
	]

	return (
		<View style={styles.summaries}>
			{summaries.map((item) => (
				<Card key={item.label} style={styles.cell} contentStyle={styles.summary}>
					<View style={styles.heading}>
						<Icon name={item.icon} color={item.color} size={compact ? 16 : 18} />
						<Copy style={[styles.statLabel, compact && styles.compactLabel]}>
							{item.label}
						</Copy>
					</View>
					<View style={[styles.value, compact && styles.compactValue]}>{item.value}</View>
				</Card>
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	summaries: { flexDirection: "row", gap: 10, marginTop: 24 },
	cell: { flex: 1, minWidth: 0 },
	summary: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 5,
		paddingTop: 16,
		paddingBottom: 8,
		gap: 2,
	},
	heading: { alignItems: "center", gap: 4 },
	value: { minHeight: 52, width: "100%", justifyContent: "center" },
	compactValue: { minHeight: 44 },
	stat: { fontSize: 24, lineHeight: 26, fontFamily: font.black, textAlign: "center" },
	compactStat: { fontSize: 20, lineHeight: 22 },
	unit: { fontSize: 14, fontFamily: font.bold },
	compactUnit: { fontSize: 12 },
	statLabel: { fontSize: 12, lineHeight: 14, color: colors.muted, textAlign: "center" },
	compactLabel: { fontSize: 11, lineHeight: 12 },
})
