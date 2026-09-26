import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Copy } from "@/components/ui/text"
import { colors, font } from "@/theme"

export function Legend() {
	const { t } = useTranslation()

	const items = [
		{ label: t("common.strip.learning"), color: colors.orange, round: false },
		{ label: t("common.strip.rest"), color: colors.blue, round: false },
		{ label: t("common.strip.sleeping"), color: colors.disabled, round: false },
		{ label: t("common.strip.mimicry"), color: colors.orange, round: true },
		{ label: t("common.strip.otherSound"), color: colors.disabled, round: true },
	]

	return (
		<View
			style={styles.legend}
			accessible={false}
			importantForAccessibility="no-hide-descendants"
		>
			{items.map((item) => (
				<View key={item.label} style={styles.legendItem}>
					<View
						style={[
							item.round ? styles.legendDot : styles.legendBar,
							{ backgroundColor: item.color },
						]}
					/>
					<Copy style={styles.legendText}>{item.label}</Copy>
				</View>
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	legend: { flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 8 },
	legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
	legendBar: { width: 18, height: 12, borderRadius: 4 },
	legendDot: { width: 12, height: 12, borderRadius: 6 },
	legendText: { fontFamily: font.extraBold, fontSize: 13, color: colors.text },
})
