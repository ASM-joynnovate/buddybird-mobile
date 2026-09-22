import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useMutation } from "@tanstack/react-query"
import { randomUUID } from "expo-crypto"
import type { TFunction } from "i18next"
import { type ReactElement, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { PermissionDialog } from "@/components/dialogs/permission-dialog"
import { Button } from "@/components/ui/button"
import { ScreenHeader } from "@/components/ui/header"
import { IconButton } from "@/components/ui/icon-button"
import { InlineError } from "@/components/ui/inline-error"
import { Screen } from "@/components/ui/screen"
import { ScreenError, Skeleton } from "@/components/ui/states"
import { TextField } from "@/components/ui/text-field"
import { deleteWordMutationOptions } from "@/hooks/apis/words"
import { useDeviceSetting } from "@/hooks/use-device-setting"
import { usePermission } from "@/hooks/use-permission"
import { useSoundPlayer } from "@/hooks/use-sound-player"
import { RecordingsSection } from "@/screens/Words/components/recordings-section"
import {
	type DraftItem,
	NAME_MAX,
	useWordDraft,
	type WordDraft,
} from "@/screens/Words/hooks/use-word-draft"
import { colors } from "@/theme"
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
	const locale = useDeviceSetting("locale")
	const guides = useDeviceSetting("guides")
	const microphone = usePermission("microphone")
	const player = useSoundPlayer()
	const routeWordId = route.params?.wordId ?? null
	const draft = useWordDraft(routeWordId, route.params?.recorded)
	const deleteWord = useMutation(deleteWordMutationOptions())
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
				{ id: routeWordId, idempotencyKey: randomUUID() },
				{
					onSuccess: () => {
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
					maxLength={NAME_MAX}
					error={draft.nameMissing ? t("words.editor.nameRequired") : null}
				/>
				<RecordingsSection
					items={draft.items}
					serverCount={draft.serverCount}
					player={player}
					locale={locale}
					missing={draft.missingRecording}
					disabled={busy}
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
							icon="trash"
							label={t("words.editor.delete")}
							color={colors.muted}
							disabled={busy}
							onPress={() => setPending({ kind: "word" })}
						/>
					) : null
				}
			/>
			{body}
			<ConfirmDialog
				visible={pending !== null}
				title={t("common.confirmDelete.title", {
					name: pending?.kind === "recording" ? pending.name : wordName,
				})}
				message={t("common.confirmDelete.message")}
				confirmLabel={t("common.confirmDelete.confirm")}
				cancelLabel={t("common.cancel")}
				busy={deleteWord.isPending}
				error={deleteWord.isError ? t("words.editor.deleteError") : null}
				onConfirm={confirmDelete}
				onClose={closeDialog}
			/>
			<PermissionDialog {...microphone.dialog} />
		</Screen>
	)
}

const styles = StyleSheet.create({
	spacer: { flex: 1, minHeight: 24 },
	save: { marginTop: 12 },
})
