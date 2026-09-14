import { ScrollView, StyleSheet } from "react-native"

import { WordCard } from "@/screens/Learning/components/word-card"
import type { Word } from "@/types/word"

export function WordList({
	words,
	selectedId,
	onSelect,
}: {
	words: Word[]
	selectedId?: string
	onSelect(id: string): void
}) {
	return (
		<ScrollView
			testID="learning-word-list"
			nestedScrollEnabled
			persistentScrollbar
			style={styles.viewport}
			contentContainerStyle={styles.words}
		>
			{words.map((item) => (
				<WordCard
					key={item.id}
					item={item}
					selected={selectedId === item.id}
					onSelect={onSelect}
				/>
			))}
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	viewport: { maxHeight: 375 },
	words: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
})
