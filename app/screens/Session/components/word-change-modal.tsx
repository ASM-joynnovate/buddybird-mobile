import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Modal, StyleSheet, View } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaView } from "react-native-safe-area-context"

import { Button } from "@/components/ui/button"
import { ScreenHeader } from "@/components/ui/header"
import { InlineError } from "@/components/ui/inline-error"
import { ScreenError, Skeleton } from "@/components/ui/states"
import { wordsQueryOptions } from "@/hooks/apis/words"
import { useSoundPlayer } from "@/hooks/use-sound-player"
import { WordPicker } from "@/screens/Session/components/word-picker"
import { colors } from "@/theme"

export function WordChangeModal({
	visible,
	currentId,
	saving,
	failed,
	onSave,
	onClose,
}: {
	visible: boolean
	currentId: string | null
	saving: boolean
	failed: boolean
	onSave(wordId: string): void
	onClose(): void
}) {
	return (
		<Modal visible={visible} animationType="slide" onRequestClose={onClose}>
			{visible ? (
				<WordChangeBody
					currentId={currentId}
					saving={saving}
					failed={failed}
					onSave={onSave}
					onClose={onClose}
				/>
			) : null}
		</Modal>
	)
}

function WordChangeBody({
	currentId,
	saving,
	failed,
	onSave,
	onClose,
}: {
	currentId: string | null
	saving: boolean
	failed: boolean
	onSave(wordId: string): void
	onClose(): void
}) {
	const { t } = useTranslation()
	const words = useQuery(wordsQueryOptions())
	const player = useSoundPlayer()
	const [selected, setSelected] = useState(currentId)

	let body = <Skeleton rows={4} />

	if (words.isError) {
		body = <ScreenError message={t("common.loadError")} onRetry={() => void words.refetch()} />
	} else if (words.data) {
		body = (
			<WordPicker
				words={words.data}
				selectedId={selected}
				player={player}
				onSelect={setSelected}
			/>
		)
	}

	return (
		<GestureHandlerRootView style={styles.root}>
			<SafeAreaView style={styles.screen}>
				<ScreenHeader
					title={t("session.monitor.changeWord")}
					backIcon="close"
					onBack={onClose}
				/>
				<View style={styles.body}>{body}</View>
				<InlineError message={failed ? t("session.monitor.changeError") : null} />
				<Button
					label={t("session.monitor.applyWord")}
					loading={saving}
					disabled={!selected || selected === currentId}
					onPress={() => {
						if (selected) {
							player.stop()
							onSave(selected)
						}
					}}
				/>
			</SafeAreaView>
		</GestureHandlerRootView>
	)
}

const styles = StyleSheet.create({
	root: { flex: 1, backgroundColor: colors.background },
	screen: {
		flex: 1,
		width: "100%",
		maxWidth: 480,
		alignSelf: "center",
		paddingHorizontal: 24,
		paddingBottom: 20,
		gap: 12,
	},
	body: { flex: 1, minHeight: 0 },
})
