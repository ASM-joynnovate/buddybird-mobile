import { useTranslation } from "react-i18next"

import { BirthdayPicker } from "@/components/profile-form/birthday-picker"
import { SpeciesPicker } from "@/components/profile-form/species-picker"
import { TextField } from "@/components/ui/text-field"
import { InlineError } from "@/components/ui/inline-error"
import type { useProfileForm } from "@/hooks/use-profile-form"

export function ProfileForm({ form }: { form: ReturnType<typeof useProfileForm> }) {
	const { t } = useTranslation()

	return (
		<>
			<TextField
				testID="profile-name"
				label={t("profile.name")}
				error={form.name.nameError}
				value={form.name.name}
				onChangeText={form.name.setName}
				editable={!form.busy}
				placeholder={t("profile.nameHint")}
				autoCapitalize="none"
				returnKeyType="done"
			/>
			<SpeciesPicker {...form.species} />
			<BirthdayPicker {...form.birthday} />
			<InlineError message={form.error} />
		</>
	)
}
