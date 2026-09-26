import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Mascot } from "@/components/mascot"
import { AudioWaveform } from "@/components/ui/audio-waveform"
import { IconButton } from "@/components/ui/icon-button"
import { SpeechBubble } from "@/components/ui/speech-bubble"
import { Tag } from "@/components/ui/tag"
import { Copy } from "@/components/ui/text"
import type { SoundPlayer } from "@/hooks/use-sound-player"
import type { TimelineSound } from "@/mocks/types"
import { colors, font } from "@/theme"

export function Greeting({ message }: { message: string }) {
	return (
		<View style={styles.greeting}>
			<Mascot size={64} />
			<SpeechBubble side="left" style={styles.bubble}>
				{message}
			</SpeechBubble>
		</View>
	)
}

export function Stat({ value, label }: { value: string; label: string }) {
	return (
		<View style={styles.stat} accessible accessibilityLabel={`${label} ${value}`}>
			<Copy style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
				{value}
			</Copy>
			<Copy style={styles.statLabel}>{label}</Copy>
		</View>
	)
}

export function BestMimicry({
	sound,
	count,
	analyzing,
	player,
}: {
	sound: TimelineSound
	count: number
	analyzing: boolean
	player: SoundPlayer
}) {
	const { t } = useTranslation()
	const playing = player.playingId === sound.id
	const url = sound.audio.url

	return (
		<View style={styles.best}>
			<IconButton
				icon={playing ? "pause" : "play"}
				label={t(playing ? "common.sound.stop" : "session.summary.playBest")}
				tone={url ? "primary" : "muted"}
				round
				size={64}
				iconSize={28}
				color={colors.onAccent}
				disabled={!url}
				onPress={() => {
					if (url) {
						player.toggle(sound.id, url)
					}
				}}
			/>
			<View style={styles.grow}>
				<View style={styles.tags}>
					{sound.wordName ? <Tag tone="primary" label={sound.wordName} /> : null}
					{analyzing ? <Tag label={t("common.sound.analyzing")} /> : null}
				</View>
				{playing ? (
					<AudioWaveform
						testID="best-mimicry-wave"
						color={colors.orange}
						height={24}
						barCount={22}
						animated
					/>
				) : (
					<Copy style={styles.caption}>{t("session.summary.bestCaption")}</Copy>
				)}
			</View>
			<View style={styles.count}>
				<Copy style={styles.statValue}>{t("session.summary.times", { count })}</Copy>
				<Copy style={styles.statLabel}>{t("session.summary.mimicked")}</Copy>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	greeting: { flexDirection: "row", alignItems: "center", gap: 14 },
	bubble: { flex: 1, minWidth: 0 },
	grow: { flex: 1, minWidth: 0, gap: 6 },
	stat: { flex: 1, minWidth: 0, gap: 2 },
	statValue: {
		fontFamily: font.black,
		fontSize: 22,
		color: colors.text,
		fontVariant: ["tabular-nums"],
	},
	statLabel: { fontFamily: font.extraBold, fontSize: 12, color: colors.muted },
	best: { flexDirection: "row", alignItems: "center", gap: 14 },
	tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
	caption: { fontSize: 13, color: colors.muted },
	count: { alignItems: "flex-end", gap: 2 },
})
