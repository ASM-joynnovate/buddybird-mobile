import { TrashIcon } from "lucide-react-native"
import type { ReactElement } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { IconButton } from "@/components/ui/icon-button"
import { PlayButton } from "@/components/ui/play-button"
import { PressableSurface } from "@/components/ui/surface"
import { Tag } from "@/components/ui/tag"
import { Copy } from "@/components/ui/text"
import type { SoundPlayer } from "@/hooks/use-sound-player"
import { colors, font } from "@/theme"
import { MAX_RECORDINGS, type Word } from "@/types/apis/words"
import { joinLabel } from "@/utils/a11y"

interface Props {
	word: Word
	learning: boolean
	player: SoundPlayer
	onPress(): void
	onDelete(): void
}

export function WordCard({ word, learning, player, onPress, onDelete }: Props): ReactElement {
	const { t } = useTranslation()

	const first = word.recordings[0]
	const playing = player.playingId === word.id
	const count = word.recordings.length

	return (
		<View>
			<PressableSurface
				depth="low"
				onPress={onPress}
				accessibilityLabel={joinLabel(
					word.name,
					t("words.list.samples", { count }),
					learning && t("words.list.learning"),
					count === 0 && t("common.needsRecording"),
				)}
				contentStyle={styles.card}
			>
				<Copy numberOfLines={1} style={styles.name}>
					{word.name}
				</Copy>
				<View style={styles.meta}>
					<View style={styles.dots}>
						{Array.from({ length: MAX_RECORDINGS }, (_, index) => (
							<View key={index} style={[styles.dot, index < count && styles.dotOn]} />
						))}
					</View>
					{learning ? <Tag label={t("words.list.learning")} tone="primary" /> : null}
					{count === 0 ? <Tag label={t("common.needsRecording")} tone="muted" /> : null}
				</View>
			</PressableSurface>
			<View style={styles.actions}>
				<IconButton
					icon={TrashIcon}
					label={t("words.list.delete", { name: word.name })}
					variant="muted"
					size="small"
					onPress={onDelete}
				/>
				{first ? (
					<PlayButton
						playing={playing}
						label={t(playing ? "common.sound.stopNamed" : "words.list.play", {
							name: word.name,
						})}
						onPress={() => player.toggle(word.id, first.url)}
					/>
				) : null}
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	card: { minHeight: 84, padding: 16, paddingRight: 124, gap: 10, justifyContent: "center" },
	name: { fontFamily: font.black, fontSize: 18, lineHeight: 24 },
	meta: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
	dots: { flexDirection: "row", gap: 4 },
	dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
	dotOn: { backgroundColor: colors.orange },
	actions: {
		position: "absolute",
		right: 16,
		top: 0,
		bottom: 2,
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
})
