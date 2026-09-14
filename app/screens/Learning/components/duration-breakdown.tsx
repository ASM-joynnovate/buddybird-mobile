import { useTranslation } from "react-i18next"

import { StyleSheet, View } from "react-native"

import { Card } from "@/components/ui/surface"

import { Copy } from "@/components/ui/text"
import { durationText } from "@/i18n/duration"
import type { Timing } from "@/types/session"
import { phaseTotals } from "@/services/session/timing"
import { colors, font, radius } from "@/theme"
import type { Locale } from "@/types/locale"

export function DurationBreakdown({ timing, locale }: { timing: Timing; locale: Locale }) {
	const { t } = useTranslation()
	const totals = phaseTotals(timing)

	return (
		<Card style={styles.spacing} contentStyle={styles.breakdown}>
			<View style={styles.breakdownHeader}>
				<Copy style={styles.breakdownTitle}>{t("learning.total")}</Copy>
				<Copy style={styles.total}>
					{durationText(timing.totalDurationSeconds, locale)}
				</Copy>
			</View>
			<View style={styles.phases}>
				{(["learning", "rest", "care"] as const).map((phase, index) => (
					<View key={phase} style={[styles.phase, index > 0 && styles.phaseBorder]}>
						<View style={styles.phaseLabelRow}>
							<View
								style={[
									styles.dot,
									{ backgroundColor: index === 0 ? colors.orange : colors.blue },
								]}
							/>
							<Copy style={styles.phaseLabel}>{t(`learning.${phase}`)}</Copy>
						</View>
						<Copy
							testID={`duration-total-${phase}`}
							style={[
								styles.phaseTime,
								{ color: index === 0 ? colors.orange : colors.blue },
							]}
						>
							{durationText(totals[index], locale)}
						</Copy>
					</View>
				))}
			</View>
		</Card>
	)
}

const styles = StyleSheet.create({
	spacing: { marginTop: 4 },
	breakdown: { padding: 0 },
	breakdownHeader: {
		backgroundColor: colors.surface,
		borderTopLeftRadius: radius.card - 2,
		borderTopRightRadius: radius.card - 2,
		padding: 16,
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 10,
	},
	breakdownTitle: { fontSize: 13, color: colors.muted, flex: 1 },
	total: { flexShrink: 1, fontFamily: font.black, fontSize: 17 },
	phases: {
		flexDirection: "row",
		borderTopWidth: 2,
		borderColor: colors.border,
	},
	phase: { flex: 1, minWidth: 0, padding: 14 },
	phaseBorder: { borderLeftWidth: 2, borderColor: colors.border },
	phaseLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
	dot: { width: 9, height: 9, borderRadius: 9 },
	phaseLabel: { flexShrink: 1, color: colors.muted, fontSize: 13 },
	phaseTime: { fontFamily: font.black, fontSize: 18, marginTop: 4 },
})
