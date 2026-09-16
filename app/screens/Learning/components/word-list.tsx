import { useState } from "react"
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native"

import { WordCard } from "@/screens/Learning/components/word-card"
import type  { Word } from "@/types/word"

export function WordList({
	words,
	selectedId,
	onSelect,
}: {
	words: Word[]
	selectedId?: string
	onSelect(id: string): void
}) {
	const [edges, setEdges] = useState({ top: true, bottom: false })
	const { height } = useWindowDimensions()
	const [contentHeight, setContentHeight] = useState(0)
	const [viewportHeight, setViewportHeight] = useState(0)
	const scrollable = contentHeight > viewportHeight + 1

	return (
		<View>
			<ScrollView
				testID="learning-word-list"
				nestedScrollEnabled
				persistentScrollbar
				scrollEventThrottle={16}
				onScroll={({ nativeEvent: { contentOffset, contentSize, layoutMeasurement } }) => {
					const top = contentOffset.y <= 8
					const bottom =
						contentOffset.y + layoutMeasurement.height >= contentSize.height - 8

					setEdges((previous) =>
						previous.top === top && previous.bottom === bottom
							? previous
							: { top, bottom },
					)
				}}
				style={[styles.viewport, { maxHeight: height * 0.45 }]}
				onLayout={({ nativeEvent }) => setViewportHeight(nativeEvent.layout.height)}
				onContentSizeChange={(_width, nextHeight) => setContentHeight(nextHeight)}
				contentContainerStyle={styles.words}
			>
				{words.map((item) => (
					<View key={item.id} style={styles.column}>
						<WordCard
							item={item}
							selected={selectedId === item.id}
							onSelect={onSelect}
						/>
					</View>
				))}
			</ScrollView>
			{scrollable && !edges.top ? (
				<View pointerEvents="none" style={[styles.fade, styles.top]} />
			) : null}
			{scrollable && !edges.bottom ? (
				<View pointerEvents="none" style={[styles.fade, styles.bottom]} />
			) : null}
		</View>
	)
}

const styles = StyleSheet.create({
	fade: { position: "absolute", left: 0, right: 0, height: "18%", maxHeight: 56 },
	top: { top: 0, experimental_backgroundImage: "linear-gradient(to bottom, #FFFFFF, #FFFFFF00)" },
	bottom: {
		bottom: 0,
		experimental_backgroundImage: "linear-gradient(to bottom, #FFFFFF00, #FFFFFF)",
	},
	viewport: { marginHorizontal: -4 },
	words: { flexDirection: "row", flexWrap: "wrap", rowGap: 8 },
	column: { width: "33.333333%", paddingHorizontal: 4 },
})
