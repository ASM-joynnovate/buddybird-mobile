import { useMutation } from "@tanstack/react-query"
import { randomUUID } from "expo-crypto"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { BuddySays } from "@/components/buddy-says"
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { PermissionDialog } from "@/components/dialogs/permission-dialog"
import { BirthdayPicker } from "@/components/profile-form/birthday-picker"
import { ProfilePhoto } from "@/components/profile-form/photo"
import { SpeciesPicker } from "@/components/profile-form/species-picker"
import { Button } from "@/components/ui/button"
import { ScreenHeader } from "@/components/ui/header"
import { IconButton } from "@/components/ui/icon-button"
import { InlineError } from "@/components/ui/inline-error"
import { GroupedList } from "@/components/ui/rows"
import { Screen } from "@/components/ui/screen"
import { TextField } from "@/components/ui/text-field"
import { deleteParrotMutationOptions } from "@/hooks/apis/parrots"
import { useParrotForm } from "@/screens/Entry/hooks/use-parrot-form"
import type { Parrot } from "@/types/apis/parrots"

export function ParrotEditorForm({
	parrot,
	canDelete,
	intro,
	onBack,
	onDone,
}: {
	parrot?: Parrot
	canDelete: boolean
	intro: boolean
	onBack?(): void
	onDone(): void
}) {
	const { t } = useTranslation()
	const form = useParrotForm(parrot, onDone)
	const removal = useMutation(deleteParrotMutationOptions())
	const [confirming, setConfirming] = useState(false)

	const deleteButton =
		parrot && canDelete ? (
			<IconButton
				icon="trash"
				label={t("entry.parrot.delete")}
				disabled={form.busy}
				onPress={() => setConfirming(true)}
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
					photoUri={form.photo.photoUri ?? undefined}
					choosePhoto={form.photo.choose}
					busy={form.busy}
					error={form.photo.error}
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
					maxLength={20}
					placeholder={t("parrot.nameHint")}
					returnKeyType="done"
				/>
				<View>
					<GroupedList>
						<SpeciesPicker first {...form.species} />
						<BirthdayPicker {...form.birthday} />
					</GroupedList>
					<InlineError message={form.species.speciesError} />
					<InlineError message={form.birthday.birthdayError} />
				</View>
			</View>
			<PermissionDialog {...form.photo.dialog} />
			{parrot ? (
				<ConfirmDialog
					visible={confirming}
					title={t("common.confirmDelete.title", { name: parrot.name })}
					message={t("common.confirmDelete.message")}
					confirmLabel={t("common.confirmDelete.confirm")}
					cancelLabel={t("common.cancel")}
					busy={removal.isPending}
					error={removal.isError ? t("entry.parrot.deleteError") : null}
					onClose={() => {
						removal.reset()
						setConfirming(false)
					}}
					onConfirm={() =>
						removal.mutate(
							{ id: parrot.id, idempotencyKey: randomUUID() },
							{
								onSuccess: () => {
									setConfirming(false)
									onDone()
								},
							},
						)
					}
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
