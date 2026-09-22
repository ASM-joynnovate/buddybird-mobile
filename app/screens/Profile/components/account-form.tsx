import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import type { User } from "@/apis/users"
import { PermissionDialog } from "@/components/dialogs/permission-dialog"
import { ProfilePhoto } from "@/components/profile-form/photo"
import { Button } from "@/components/ui/button"
import { TextButton } from "@/components/ui/header"
import { InlineError } from "@/components/ui/inline-error"
import { TextField } from "@/components/ui/text-field"
import { useAccountForm } from "@/screens/Profile/hooks/use-account-form"

export function AccountForm({ user, onSaved }: { user: User; onSaved(): void }) {
	const { t } = useTranslation()
	const form = useAccountForm(user, onSaved)

	return (
		<>
			<ProfilePhoto
				photoUri={form.photo.photoUri ?? undefined}
				choosePhoto={form.photo.choose}
				busy={form.busy}
				error={form.photo.error}
				action={form.photo.photoUri ? "edit" : "plus"}
			/>
			{form.photo.photoUri ? (
				<View style={styles.remove}>
					<TextButton
						label={t("profile.removePhoto")}
						tone="muted"
						disabled={form.busy}
						onPress={() => form.photo.setPhotoUri(null)}
					/>
				</View>
			) : null}
			<TextField
				label={t("profile.nickname")}
				error={form.nicknameError}
				value={form.nickname}
				onChangeText={form.setNickname}
				editable={!form.busy}
				maxLength={20}
				placeholder={t("profile.nicknameHint")}
				autoCapitalize="none"
				returnKeyType="done"
				onSubmitEditing={form.save}
			/>
			<View style={styles.spacer} />
			<InlineError message={form.error} />
			<Button
				label={t("common.save")}
				loading={form.busy}
				onPress={form.save}
				style={styles.save}
			/>
			<PermissionDialog {...form.photo.dialog} />
		</>
	)
}

const styles = StyleSheet.create({
	remove: { alignItems: "flex-end", marginTop: -12, marginBottom: 8 },
	spacer: { flexGrow: 1, minHeight: 24 },
	save: { marginTop: 12 },
})
