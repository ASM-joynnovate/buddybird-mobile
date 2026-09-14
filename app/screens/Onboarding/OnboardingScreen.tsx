import { useTranslation } from "react-i18next"

import { Image, StyleSheet, View } from "react-native"

import { ProfileForm } from "@/components/profile-form/index"
import { Button } from "@/components/ui/button"
import { Screen } from "@/components/ui/screen"
import { Copy, Title } from "@/components/ui/text"
import { useOnboarding } from "@/screens/Onboarding/hooks/use-onboarding"
import { colors, mascot } from "@/theme"

export function OnboardingScreen({ telemetryReady }: { telemetryReady: boolean }) {
	const { t } = useTranslation()
	const { step, begin, profile } = useOnboarding(telemetryReady)

	if (step === "profile") {
		return <ProfileForm onboarding={profile} />
	}

	return (
		<Screen contentContainerStyle={styles.content}>
			<View style={styles.intro}>
				<Image accessible={false} source={mascot} style={styles.mascot} />
				<Title style={styles.title}>{t("onboarding.title")}</Title>
				<Copy style={styles.description}>{t("onboarding.message")}</Copy>
			</View>
			<Button
				testID="onboarding-welcome-start"
				label={t("onboarding.start")}
				onPress={begin}
			/>
		</Screen>
	)
}

const styles = StyleSheet.create({
	content: { justifyContent: "space-between", paddingBottom: 36 },
	intro: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 36 },
	mascot: { width: 220, height: 220, resizeMode: "contain", marginBottom: 30 },
	title: { textAlign: "center" },
	description: {
		textAlign: "center",
		color: colors.muted,
		fontSize: 19,
		lineHeight: 30,
		marginTop: 20,
	},
})
