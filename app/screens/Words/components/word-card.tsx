import type { ReactElement } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { IconButton } from "@/components/ui/icon-button"
import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import type { SoundPlayer } from "@/hooks/use-sound-player"
import { colors, font, radius } from "@/theme"
import { MAX_RECORDINGS, type Word } from "@/types/apis/words"

export function WordCard({
	word,
	learning,
	player,
	onPress,
}: {
	word: Word
	learning: boolean
	player: SoundPlayer
	onPress(): void
}): ReactElement {
	const { t } = useTranslation()

	const first = word.recordings[0]
	const playing = player.playingId === word.id
	const count = word.recordings.length

	return (
		<View>
			<PressableSurface
				depth={2}
				onPress={onPress}
				accessibilityLabel={[
					word.name,
					t("words.list.samples", { count }),
					learning ? t("words.list.learning") : null,
					count === 0 ? t("words.list.needsRecording") : null,
				]
					.filter(Boolean)
					.join(", ")}
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
					{learning ? <Tag label={t("words.list.learning")} tone="orange" /> : null}
					{count === 0 ? (
						<Tag label={t("words.list.needsRecording")} tone="muted" />
					) : null}
				</View>
			</PressableSurface>
			{first ? (
				<View style={styles.play}>
					<IconButton
						icon={playing ? "pause" : "play"}
						label={t(playing ? "words.list.stop" : "words.list.play", {
							name: word.name,
						})}
						tone="primary"
						round
						color={colors.onAccent}
						size={44}
						iconSize={20}
						onPress={() => player.toggle(word.id, first.url)}
					/>
				</View>
			) : null}
		</View>
	)
}

function Tag({ label, tone }: { label: string; tone: "orange" | "muted" }) {
	return (
		<View style={[styles.tag, tone === "orange" ? styles.tagOrange : styles.tagMuted]}>
			<Copy style={[styles.tagText, tone === "orange" && styles.tagTextOrange]}>{label}</Copy>
		</View>
	)
}

const styles = StyleSheet.create({
	card: { minHeight: 84, padding: 16, paddingRight: 76, gap: 10, justifyContent: "center" },
	name: { fontFamily: font.black, fontSize: 18, lineHeight: 24 },
	meta: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
	dots: { flexDirection: "row", gap: 4 },
	dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
	dotOn: { backgroundColor: colors.orange },
	play: { position: "absolute", right: 16, top: 0, bottom: 2, justifyContent: "center" },
	tag: {
		borderRadius: radius.pill,
		borderWidth: 2,
		paddingHorizontal: 10,
		paddingVertical: 2,
	},
	tagOrange: { backgroundColor: colors.orangeSelected, borderColor: colors.orange },
	tagMuted: { backgroundColor: colors.surface, borderColor: colors.border },
	tagText: { fontFamily: font.extraBold, fontSize: 12.5, color: colors.muted },
	tagTextOrange: { color: colors.orangeDark },
})
