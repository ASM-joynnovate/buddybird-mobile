import { useTranslation } from "react-i18next"

import { ProfileFormHeader } from "@/components/profile-form/header"
import { ProfileForm } from "@/components/profile-form/index"
import { ProfilePhoto } from "@/components/profile-form/photo"
import { Button } from "@/components/ui/button"
import { Screen } from "@/components/ui/screen"
import { useProfileForm } from "@/hooks/use-profile-form"

export function ProfileEditorScreen() {
	const form = useProfileForm()
	const { t } = useTranslation()

	return (
		<Screen>
			<ProfileFormHeader busy={form.busy} onBack={form.goBack} />
			<ProfilePhoto {...form.photo} />
			<ProfileForm form={form} />
			<Button
				testID="profile-save"
				label={t("common.save")}
				loading={form.busy}
				onPress={() => void form.save()}
				style={{ marginTop: 24 }}
			/>
		</Screen>
	)
}
