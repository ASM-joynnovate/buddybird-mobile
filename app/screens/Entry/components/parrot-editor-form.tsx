import { TrashIcon } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { BuddySays } from "@/components/buddy-says"
import { DatePicker } from "@/components/date-picker"
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { PermissionDialog } from "@/components/dialogs/permission-dialog"
import { ProfilePhoto } from "@/components/profile-form/photo"
import { SpeciesPicker } from "@/components/profile-form/species-picker"
import { Button } from "@/components/ui/button"
import { GroupedList } from "@/components/ui/grouped-list"
import { IconButton } from "@/components/ui/icon-button"
import { InlineError } from "@/components/ui/inline-error"
import { Screen } from "@/components/ui/screen"
import { ScreenHeader } from "@/components/ui/screen-header"
import { TextField } from "@/components/ui/text-field"
import { useParrotForm } from "@/screens/Entry/hooks/use-parrot-form"
import { PARROT_NAME_LIMIT, type Parrot } from "@/types/apis/parrots"

interface Props {
	parrot?: Parrot
	canDelete: boolean
	intro: boolean
	onBack?(): void
	onDone(): void
}

export function ParrotEditorForm({ parrot, canDelete, intro, onBack, onDone }: Props) {
	const { t } = useTranslation()

	const form = useParrotForm(parrot, onDone)

	const deleteButton =
		parrot && canDelete ? (
			<IconButton
				icon={TrashIcon}
				label={t("entry.parrot.delete")}
				disabled={form.busy}
				onPress={form.removal.ask}
			/>
		) : undefined

	return (
		<Screen
			footer={
				<>
					<InlineError message={form.error} />
					<Button
						label={t(parrot ? "common.save" : "entry.parrot.register")}
						disabled={!form.ready}
						loading={form.busy}
						onPress={form.save}
					/>
				</>
			}
		>
			<ScreenHeader
				title={t(parrot ? "entry.parrot.editTitle" : "entry.parrot.addTitle")}
				onBack={onBack}
				right={deleteButton}
			/>
			{intro ? (
				<View style={styles.buddy}>
					<BuddySays message={t("entry.parrot.intro")} />
				</View>
			) : null}
			<View style={styles.intro}>
				<ProfilePhoto
					photo={form.photo}
					busy={form.busy}
					action={form.photo.photoUri ? "edit" : "plus"}
				/>
			</View>
			<View style={styles.fields}>
				<TextField
					label={t("parrot.name")}
					error={form.name.error}
					value={form.name.value}
					onChangeText={form.name.onChange}
					editable={!form.busy}
					maxLength={PARROT_NAME_LIMIT}
					placeholder={t("parrot.nameHint")}
					returnKeyType="done"
				/>
				<View>
					<GroupedList>
						<SpeciesPicker first {...form.species} />
						<DatePicker value={form.birthday.value} onChange={form.birthday.onChange} />
					</GroupedList>
					<InlineError message={form.species.speciesError} />
					<InlineError message={form.birthday.error} />
				</View>
			</View>
			<PermissionDialog state={form.photo.libraryDialog} />
			<PermissionDialog state={form.photo.cameraDialog} />
			{parrot ? (
				<ConfirmDialog
					visible={form.removal.open}
					text={{
						title: t("common.confirmDelete.title", { name: parrot.name }),
						message: t("common.confirmDelete.message"),
					}}
					state={{ busy: form.removal.busy, error: form.removal.error }}
					onClose={form.removal.close}
					onConfirm={form.removal.confirm}
				/>
			) : null}
		</Screen>
	)
}

const styles = StyleSheet.create({
	intro: { flexGrow: 1, justifyContent: "center" },
	buddy: { marginTop: 4 },
	fields: { gap: 16 },
})
