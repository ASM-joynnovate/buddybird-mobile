import { BottomSheetFlatList } from "@gorhom/bottom-sheet"
import { StyleSheet } from "react-native"

import { WordChoice } from "@/components/session/word-picker/word-choice"
import type { SoundPlayer } from "@/hooks/use-sound-player"
import type { Word } from "@/types/apis/words"

export function selectableWords(words: readonly Word[]): Word[] {
	return words.filter((word) => word.recordings.length > 0)
}

interface Props {
	words: readonly Word[]
	selectedId: string | null
	player: SoundPlayer
	onSelect(id: string): void
}

export function WordPicker({ words, selectedId, player, onSelect }: Props) {
	return (
		<BottomSheetFlatList
			data={words}
			keyExtractor={(word) => word.id}
			contentContainerStyle={styles.list}
			showsVerticalScrollIndicator={false}
			renderItem={({ item }) => (
				<WordChoice
					word={item}
					selected={item.id === selectedId}
					player={player}
					onSelect={onSelect}
				/>
			)}
		/>
	)
}

const styles = StyleSheet.create({
	list: { gap: 10, paddingHorizontal: 24, paddingBottom: 20 },
})
