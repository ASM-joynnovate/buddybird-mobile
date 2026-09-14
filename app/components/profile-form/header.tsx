import { useTranslation } from "react-i18next"

import { Image, StyleSheet, View } from "react-native"

import { IconButton } from "@/components/ui/icon-button"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"
import { colors, font, mascot } from "@/theme"

export function ProfileFormHeader({
	onboarding,
	busy,
	onBack,
}: {
	onboarding: boolean
	busy: boolean
	onBack(): void
}) {
	const { t } = useTranslation()

	return (
		<>
			{onboarding ? (
				<View style={styles.intro}>
					<IconButton
						testID="onboarding-back"
						icon="back"
						label={t("common.back")}
						disabled={busy}
						onPress={onBack}
					/>
					<Image source={mascot} style={styles.smallMascot} />
					<View style={styles.speech}>
						<Copy style={styles.introText}>{t("profile.intro")}</Copy>
					</View>
				</View>
			) : (
				<View style={[ui.row, styles.header]}>
					<IconButton
						icon="back"
						label={t("common.back")}
						disabled={busy}
						onPress={onBack}
					/>
					<Copy style={styles.headerText}>{t("profile.edit")}</Copy>
				</View>
			)}
		</>
	)
}

const styles = StyleSheet.create({
	intro: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
	smallMascot: { width: 66, height: 76, resizeMode: "contain" },
	speech: { flex: 1, borderWidth: 2, borderColor: colors.border, borderRadius: 20, padding: 17 },
	introText: { fontFamily: font.extraBold, fontSize: 19, lineHeight: 27 },
	header: { marginLeft: -8, marginBottom: 18 },
	headerText: { fontSize: 17, fontFamily: font.extraBold },
})
