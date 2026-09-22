import type { ReactElement } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import type { Report } from "@/apis/reports"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"
import { colors, font, radius } from "@/theme"

export function WordBars({ words }: { words: Report["words"] }): ReactElement | null {
	const { t } = useTranslation()

	if (words.length === 0) {
		return null
	}

	const max = Math.max(1, ...words.map((item) => item.play_count))

	return (
		<View style={ui.section}>
			<Copy accessibilityRole="header" style={ui.sectionTitle}>
				{t("report.words")}
			</Copy>
			<View style={styles.list}>
				{words.map((item) => (
					<View
						key={item.word.id}
						style={styles.row}
						accessible
						accessibilityLabel={`${item.word.name}, ${t("report.count", { count: item.play_count })}`}
					>
						<Copy numberOfLines={1} style={styles.name}>
							{item.word.name}
						</Copy>
						<View style={styles.track}>
							<View
								style={[
									styles.fill,
									{ width: `${(item.play_count / max) * 100}%` },
								]}
							/>
						</View>
						<Copy style={styles.value}>{item.play_count}</Copy>
					</View>
				))}
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	list: { gap: 10 },
	row: { flexDirection: "row", alignItems: "center", gap: 10 },
	name: { width: 72, fontFamily: font.extraBold },
	track: {
		flex: 1,
		height: 14,
		borderRadius: 8,
		backgroundColor: colors.surface,
		overflow: "hidden",
	},
	fill: { height: "100%", borderRadius: radius.pill, backgroundColor: colors.orange },
	value: {
		minWidth: 40,
		textAlign: "right",
		fontFamily: font.extraBold,
		fontVariant: ["tabular-nums"],
	},
})
