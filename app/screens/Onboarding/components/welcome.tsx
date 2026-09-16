import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Mascot } from "@/components/mascot"
import { Button } from "@/components/ui/button"
import { Screen } from "@/components/ui/screen"
import { SpeechBubble } from "@/components/ui/speech-bubble"
import { Copy, Title } from "@/components/ui/text"
import { colors, font } from "@/theme"

export function Welcome({ onStart }: { onStart(): void }) {
	const { t } = useTranslation()

	return (
		<Screen contentContainerStyle={styles.screen}>
			<View style={styles.hero}>
				<SpeechBubble style={styles.bubble}>{t("onboarding.bubble")}</SpeechBubble>
				<Mascot size={150} />
			</View>
			<View style={styles.copy}>
				<Title style={styles.center}>{t("onboarding.title")}</Title>
				<Copy style={styles.body}>
					{t("onboarding.before")}
					<Copy style={styles.emphasis}>{t("onboarding.emphasis")}</Copy>
					{t("onboarding.after")}
				</Copy>
				<Button
					testID="onboarding-welcome-start"
					label={t("onboarding.start")}
					onPress={onStart}
					style={styles.button}
				/>
			</View>
		</Screen>
	)
}

const styles = StyleSheet.create({
	screen: { paddingTop: 60, paddingBottom: 52 },
	hero: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 28,
	},
	bubble: { width: "100%", maxWidth: 300, marginBottom: 28 },
	copy: { alignItems: "center" },
	center: { textAlign: "center" },
	body: {
		color: colors.muted,
		fontSize: 14,
		lineHeight: 22,
		textAlign: "center",
		marginTop: 6,
		marginBottom: 20,
	},
	emphasis: { fontFamily: font.black, fontSize: 14 },
	button: { width: "100%", maxWidth: 354 },
})
