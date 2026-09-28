import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useQuery } from "@tanstack/react-query"
import { MessageSquareTextIcon, PlusIcon } from "lucide-react-native"
import { type ReactElement, useState } from "react"
import { useTranslation } from "react-i18next"
import { FlatList, StyleSheet, View } from "react-native"

import { Illustration } from "@/components/illustration"
import { EmptyState } from "@/components/ui/empty-state"
import { IconButton } from "@/components/ui/icon-button"
import { InlineError } from "@/components/ui/inline-error"
import { Screen } from "@/components/ui/screen"
import { ScreenError } from "@/components/ui/screen-error"
import { ScreenHeader } from "@/components/ui/screen-header"
import { Skeleton } from "@/components/ui/skeleton"
import { runningSessionQueryOptions } from "@/hooks/apis/sessions"
import { useIdempotentMutation } from "@/hooks/apis/use-idempotent-mutation"
import { deleteWordMutationOptions, wordsQueryOptions } from "@/hooks/apis/words"
import { useSoundPlayer } from "@/hooks/use-sound-player"
import { DeleteWordDialog } from "@/screens/words/components/delete-word-dialog"
import { WordCard } from "@/screens/words/components/word-card"
import { track } from "@/services/telemetry/client"
import { contentMaxWidth } from "@/theme"
import type { Word } from "@/types/apis/words"
import type { WordsStackParamList } from "@/types/navigation"

export function WordListScreen(): ReactElement {
	const { t } = useTranslation()

	const navigation = useNavigation<NativeStackNavigationProp<WordsStackParamList>>()

	const words = useQuery(wordsQueryOptions())
	const running = useQuery(runningSessionQueryOptions())

	const removing = useIdempotentMutation(deleteWordMutationOptions())

	const player = useSoundPlayer()

	const [deleting, setDeleting] = useState<Word | null>(null)

	const learningWordId = running.data?.word_id ?? null

	const addWord = () => navigation.navigate("WordEditor", {})

	const addButton = <IconButton icon={PlusIcon} label={t("words.list.add")} onPress={addWord} />
	const illustration = (
		<Illustration
			scene={t("words.list.emptyScene")}
			icon={MessageSquareTextIcon}
			height={200}
		/>
	)
	const empty = (
		<EmptyState
			message={t("words.list.empty")}
			illustration={illustration}
			action={{ label: t("words.list.add"), onPress: addWord }}
		/>
	)

	let body: ReactElement

	if (words.isPending) {
		body = <Skeleton rows={4} height={84} />
	} else if (words.isError) {
		body = <ScreenError message={t("common.loadError")} onRetry={() => void words.refetch()} />
	} else {
		body = (
			<FlatList
				data={words.data}
				keyExtractor={(word) => word.id}
				contentContainerStyle={styles.list}
				showsVerticalScrollIndicator={false}
				renderItem={({ item }) => (
					<WordCard
						word={item}
						learning={item.id === learningWordId}
						player={player}
						onPress={() => navigation.navigate("WordEditor", { wordId: item.id })}
						onDelete={() => setDeleting(item)}
					/>
				)}
				ListEmptyComponent={empty}
			/>
		)
	}

	return (
		<Screen scroll={false}>
			<View style={styles.screen}>
				<ScreenHeader title={t("words.list.title")} large right={addButton} />
				<InlineError message={player.failedId ? t("common.sound.playError") : null} />
				{body}
			</View>
			<DeleteWordDialog
				visible={deleting !== null}
				name={deleting?.name ?? ""}
				deletion={removing}
				onConfirm={() => {
					if (deleting) {
						removing.mutate(
							{ id: deleting.id },
							{
								onSuccess: () => {
									track("word_deleted", {
										word_id: deleting.id,
										recording_count: deleting.recordings.length,
									})

									setDeleting(null)
								},
							},
						)
					}
				}}
				onClose={() => {
					removing.reset()

					setDeleting(null)
				}}
			/>
		</Screen>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		width: "100%",
		maxWidth: contentMaxWidth,
		alignSelf: "center",
		paddingHorizontal: 24,
		paddingTop: 12,
	},
	list: { gap: 12, paddingTop: 8, paddingBottom: 24, flexGrow: 1 },
})
