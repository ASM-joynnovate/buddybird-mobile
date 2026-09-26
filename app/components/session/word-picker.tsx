import { BottomSheetFlatList } from "@gorhom/bottom-sheet"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { IconButton } from "@/components/ui/icon-button"
import { ChoiceCard } from "@/components/ui/surface"
import { Tag } from "@/components/ui/tag"
import { Copy } from "@/components/ui/text"
import type { SoundPlayer } from "@/hooks/use-sound-player"
import { colors, font } from "@/theme"
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

function WordChoice({
	word,
	selected,
	player,
	onSelect,
}: {
	word: Word
	selected: boolean
	player: SoundPlayer
	onSelect(id: string): void
}) {
	const { t } = useTranslation()
	const sample = word.recordings[0]
	const playing = player.playingId === word.id

	return (
		<ChoiceCard
			selected={selected}
			disabled={!sample}
			onPress={() => onSelect(word.id)}
			accessibilityLabel={word.name}
			contentStyle={styles.card}
		>
			<View style={styles.label}>
				<Copy numberOfLines={1} style={[styles.name, !sample && styles.locked]}>
					{word.name}
				</Copy>
				{sample ? null : <Tag label={t("session.words.needsRecording")} />}
			</View>
			{sample ? (
				<IconButton
					icon={playing ? "pause" : "play"}
					label={t(playing ? "common.sound.stop" : "session.words.preview", {
						name: word.name,
					})}
					tone="primary"
					round
					size={44}
					iconSize={18}
					color={colors.onAccent}
					onPress={() => player.toggle(word.id, sample.url)}
				/>
			) : null}
		</ChoiceCard>
	)
}

const styles = StyleSheet.create({
	list: { gap: 10, paddingHorizontal: 24, paddingBottom: 20 },
	card: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 72 },
	label: { flex: 1, minWidth: 0, gap: 6 },
	name: { fontFamily: font.black, fontSize: 18, color: colors.text },
	locked: { color: colors.disabled },
})
