import type { ReactElement } from "react"
import { useTranslation } from "react-i18next"
import { FlatList, StyleSheet, View } from "react-native"

import type { Word } from "@/apis/words"
import { IconButton } from "@/components/ui/icon-button"
import { ChoiceCard } from "@/components/ui/surface"
import { Tag } from "@/components/ui/tag"
import { Copy } from "@/components/ui/text"
import type { SoundPlayer } from "@/hooks/use-sound-player"
import { colors, font } from "@/theme"

export function selectableWords(words: readonly Word[]): Word[] {
	return words.filter((word) => word.recordings.length > 0)
}

type WordPickerProps = {
	words: readonly Word[]
	selectedId: string | null
	disabled?: boolean
	player: SoundPlayer
	onSelect(id: string): void
	header?: ReactElement
	footer?: ReactElement
}

export function WordPicker({
	words,
	selectedId,
	disabled,
	player,
	onSelect,
	header,
	footer,
}: WordPickerProps) {
	return (
		<FlatList
			data={words}
			keyExtractor={(word) => word.id}
			ListHeaderComponent={header}
			ListFooterComponent={footer}
			contentContainerStyle={styles.list}
			showsVerticalScrollIndicator={false}
			renderItem={({ item }) => (
				<WordChoice
					word={item}
					selected={item.id === selectedId}
					disabled={disabled}
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
	disabled,
	player,
	onSelect,
}: {
	word: Word
	selected: boolean
	disabled?: boolean
	player: SoundPlayer
	onSelect(id: string): void
}) {
	const { t } = useTranslation()
	const sample = word.recordings[0]
	const playing = player.playingId === word.id
	const locked = disabled || !sample

	return (
		<ChoiceCard
			selected={selected && !disabled}
			disabled={locked}
			onPress={() => onSelect(word.id)}
			accessibilityLabel={word.name}
			contentStyle={styles.card}
		>
			<View style={styles.label}>
				<Copy numberOfLines={1} style={[styles.name, locked && styles.locked]}>
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
					disabled={disabled}
					onPress={() => player.toggle(word.id, sample.url)}
				/>
			) : null}
		</ChoiceCard>
	)
}

const styles = StyleSheet.create({
	list: { gap: 10, paddingBottom: 20 },
	card: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 72 },
	label: { flex: 1, minWidth: 0, gap: 6 },
	name: { fontFamily: font.black, fontSize: 18, color: colors.text },
	locked: { color: colors.disabled },
})
