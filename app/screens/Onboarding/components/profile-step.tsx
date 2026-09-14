import { useTranslation } from "react-i18next"
import { Image, KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { ProfileForm } from "@/components/profile-form/index"
import { ProfilePhoto } from "@/components/profile-form/photo"
import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import { Screen } from "@/components/ui/screen"
import { SpeechBubble } from "@/components/ui/speech-bubble"
import { useProfileForm } from "@/hooks/use-profile-form"
import { colors } from "@/theme"
import { ProfileOnboarding } from "@/types/profile"

export function ProfileStep({ onboarding }: { onboarding: ProfileOnboarding }) {
	const { t } = useTranslation()
	const insets = useSafeAreaInsets()
	const form = useProfileForm(onboarding)

	return (
		<KeyboardAvoidingView
			style={styles.screen}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
		>
			<Screen
				automaticallyAdjustKeyboardInsets={false}
				contentContainerStyle={styles.content}
			>
				<IconButton
					testID="onboarding-back"
					icon="back"
					label={t("common.back")}
					onPress={form.goBack}
					disabled={form.busy}
				/>
				<View style={styles.intro}>
					<Image
						source={require("@assets/images/icon.png")}
						accessibilityLabel={t("common.mascot")}
						style={styles.icon}
					/>
					<SpeechBubble side="left" style={styles.bubble}>
						{t("profile.intro")}
					</SpeechBubble>
				</View>
				<ProfilePhoto {...form.photo} action="plus" />
				<ProfileForm form={form} />
			</Screen>
			<View style={[styles.footer, { paddingBottom: insets.bottom + 34 }]}>
				<Button
					testID="onboarding-start"
					label={t("profile.start")}
					loading={form.busy}
					onPress={() => void form.save()}
				/>
			</View>
		</KeyboardAvoidingView>
	)
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.background },
	content: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 24 },
	intro: { flexDirection: "row", alignItems: "flex-end", gap: 12, marginBottom: 20 },
	icon: { width: "20%", maxWidth: 64, aspectRatio: 1, borderRadius: 32 },
	bubble: { flex: 1, minWidth: 0, marginBottom: 4 },
	footer: {
		paddingTop: 14,
		paddingHorizontal: 22,
		borderTopWidth: 2,
		borderColor: colors.border,
		width: "100%",
		maxWidth: 480,
		alignSelf: "center",
	},
})
