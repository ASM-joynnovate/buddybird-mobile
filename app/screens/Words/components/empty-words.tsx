import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Copy } from "@/components/ui/text"
import { colors } from "@/theme"

export function EmptyWords() {
	const { t } = useTranslation()

	return (
		<View style={styles.empty}>
			<Copy style={styles.parrot}>🦜</Copy>
			<Copy>{t("words.empty")}</Copy>
			<Copy style={styles.emptyHint}>{t("words.emptyHint")}</Copy>
		</View>
	)
}

const styles = StyleSheet.create({
	empty: { alignItems: "center", paddingTop: 45, gap: 10 },
	parrot: { fontSize: 44 },
	emptyHint: { color: colors.muted, textAlign: "center", lineHeight: 23 },
})
