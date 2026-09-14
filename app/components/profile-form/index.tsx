import { useTranslation } from "react-i18next"

import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native"

import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"

import { TextField } from "@/components/ui/text-field"

import { BirthdayPicker } from "@/components/profile-form/birthday-picker"
import { ProfileFormHeader } from "@/components/profile-form/header"
import { ProfilePhoto } from "@/components/profile-form/photo"
import { SpeciesPicker } from "@/components/profile-form/species-picker"
import { Button } from "@/components/ui/button"
import { useProfileForm } from "@/hooks/use-profile-form"
import { colors } from "@/theme"
import type { ProfileOnboarding } from "@/types/profile"

export function ProfileForm({ onboarding }: { onboarding?: ProfileOnboarding }) {
	const { t } = useTranslation()
	const insets = useSafeAreaInsets()
	const {
		name: { name, setName, nameError },
		photo,
		species,
		birthday,
		busy,
		goBack,
		save,
	} = useProfileForm(onboarding)

	return (
		<SafeAreaView edges={["top"]} style={styles.screen}>
			<KeyboardAvoidingView
				style={styles.screen}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<ScrollView
					keyboardShouldPersistTaps="handled"
					keyboardDismissMode="on-drag"
					contentContainerStyle={[
						styles.content,
						{ paddingBottom: onboarding ? 24 : insets.bottom + 30 },
					]}
				>
					<ProfileFormHeader onboarding={!!onboarding} busy={busy} onBack={goBack} />

					<ProfilePhoto {...photo} />

					<TextField
						testID="profile-name"
						label={t("profile.name")}
						error={nameError}
						value={name}
						onChangeText={setName}
						editable={!busy}
						placeholder={t("profile.nameHint")}
						autoCapitalize="words"
						returnKeyType="done"
					/>

					<SpeciesPicker {...species} />

					<BirthdayPicker {...birthday} />
					{!onboarding ? (
						<Button
							testID="profile-save"
							label={t("common.save")}
							loading={busy}
							onPress={() => void save()}
							style={styles.save}
						/>
					) : null}
				</ScrollView>

				{onboarding ? (
					<View style={[styles.footer, { paddingBottom: Math.max(18, insets.bottom) }]}>
						<Button
							testID="onboarding-start"
							label={t("profile.start")}
							loading={busy}
							onPress={() => void save()}
						/>
					</View>
				) : null}
			</KeyboardAvoidingView>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.background },
	content: { padding: 22, width: "100%", maxWidth: 680, alignSelf: "center" },
	save: { marginTop: 26 },
	footer: {
		paddingTop: 14,
		paddingHorizontal: 22,
		borderTopWidth: 2,
		borderColor: colors.border,
		width: "100%",
		maxWidth: 680,
		alignSelf: "center",
		backgroundColor: colors.background,
	},
})
