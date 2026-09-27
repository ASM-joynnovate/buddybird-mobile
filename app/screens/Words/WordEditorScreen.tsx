import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { TFunction } from "i18next"
import { TrashIcon } from "lucide-react-native"
import { type ReactElement, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { PermissionDialog } from "@/components/dialogs/permission-dialog"
import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import { InlineError } from "@/components/ui/inline-error"
import { Screen } from "@/components/ui/screen"
import { ScreenError } from "@/components/ui/screen-error"
import { ScreenHeader } from "@/components/ui/screen-header"
import { Skeleton } from "@/components/ui/skeleton"
import { TextField } from "@/components/ui/text-field"
import { useIdempotentMutation } from "@/hooks/apis/use-idempotent-mutation"
import { deleteWordMutationOptions } from "@/hooks/apis/words"
import { usePermission } from "@/hooks/use-permission"
import { useSoundPlayer } from "@/hooks/use-sound-player"
import { DeleteWordDialog } from "@/screens/Words/components/delete-word-dialog"
import { RecordingsSection } from "@/screens/Words/components/recordings-section"
import { type DraftItem, useWordDraft, type WordDraft } from "@/screens/Words/hooks/use-word-draft"
import { track } from "@/services/telemetry/client"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { WORD_NAME_LIMIT } from "@/types/apis/words"
import type { RootStackParamList, WordsStackParamList } from "@/types/navigation"

type PendingDelete = { kind: "word" } | { kind: "recording"; item: DraftItem; name: string }

function saveLabel(draft: WordDraft, t: TFunction): string {
	if (draft.step) {
		return t(`words.editor.${draft.step}`)
	}

	return draft.saveFailed ? t("common.retry") : t("words.editor.save")
}

export function WordEditorScreen(): ReactElement {
	const { t } = useTranslation()

	const route = useRoute<RouteProp<WordsStackParamList, "WordEditor">>()
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const routeWordId = route.params?.wordId ?? null

	const guides = useDeviceSettingsStore((state) => state.guides)

	const deleteWord = useIdempotentMutation(deleteWordMutationOptions())

	const microphone = usePermission("microphone")

	const player = useSoundPlayer()

	const draft = useWordDraft(routeWordId, route.params?.recorded)

	const [pending, setPending] = useState<PendingDelete | null>(null)

	const busy = draft.step !== null
	const wordName = draft.name.trim()

	function openRecorder() {
		player.stop()

		void microphone.run(() => {
			if (guides.recording) {
				navigation.navigate("Recorder", { wordName })
			} else {
				navigation.navigate("RecordingGuide", { source: "add", wordName })
			}
		})
	}

	function confirmDelete() {
		if (pending?.kind === "recording") {
			draft.removeItem(pending.item)

			setPending(null)
		} else if (routeWordId) {
			deleteWord.mutate(
				{ id: routeWordId },
				{
					onSuccess: () => {
						track("word_deleted", {
							word_id: routeWordId,
							recording_count: draft.savedRecordingCount,
						})

						setPending(null)

						navigation.goBack()
					},
				},
			)
		}
	}

	function closeDialog() {
		deleteWord.reset()

		setPending(null)
	}

	let body: ReactElement

	if (draft.loading) {
		body = <Skeleton rows={3} />
	} else if (draft.loadFailed) {
		body = <ScreenError message={t("common.loadError")} onRetry={draft.reload} />
	} else {
		body = (
			<>
				<TextField
					label={t("words.editor.name")}
					placeholder={t("words.editor.nameHint")}
					value={draft.name}
					onChangeText={draft.setName}
					editable={!busy}
					maxLength={WORD_NAME_LIMIT}
					error={draft.nameMissing ? t("words.editor.nameRequired") : null}
				/>
				<RecordingsSection
					draft={draft}
					player={player}
					onDelete={(item, name) => setPending({ kind: "recording", item, name })}
					onAdd={openRecorder}
					onHelp={() =>
						navigation.navigate("RecordingGuide", { source: "help", wordName })
					}
				/>
				<View style={styles.spacer} />
				<InlineError message={draft.saveFailed ? t("words.editor.saveError") : null} />
				<Button
					label={saveLabel(draft, t)}
					loading={busy}
					onPress={() => {
						player.stop()

						void draft.save(() => navigation.goBack())
					}}
					style={styles.save}
				/>
			</>
		)
	}

	return (
		<Screen>
			<ScreenHeader
				title={t(routeWordId ? "words.editor.editTitle" : "words.editor.addTitle")}
				onBack={() => navigation.goBack()}
				right={
					routeWordId ? (
						<IconButton
							icon={TrashIcon}
							label={t("words.editor.delete")}
							variant="muted"
							disabled={busy}
							onPress={() => setPending({ kind: "word" })}
						/>
					) : null
				}
			/>
			{body}
			<DeleteWordDialog
				visible={pending?.kind === "word"}
				name={wordName}
				deletion={deleteWord}
				onConfirm={confirmDelete}
				onClose={closeDialog}
			/>
			<ConfirmDialog
				visible={pending?.kind === "recording"}
				text={{
					title: t("common.confirmDelete.title", {
						name: pending?.kind === "recording" ? pending.name : "",
					}),
					message: t("common.confirmDelete.message"),
				}}
				onConfirm={confirmDelete}
				onClose={closeDialog}
			/>
			<PermissionDialog state={microphone.dialog} />
		</Screen>
	)
}

const styles = StyleSheet.create({
	spacer: { flex: 1, minHeight: 24 },
	save: { marginTop: 12 },
})
