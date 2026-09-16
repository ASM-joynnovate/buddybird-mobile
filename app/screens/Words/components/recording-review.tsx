import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { AudioWaveform } from "@/components/ui/audio-waveform"
import { IconButton } from "@/components/ui/icon-button"
import { Card } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { categoryColors, colors } from "@/theme"

export function RecordingReview({
	playing,
	category,
	elapsedSeconds,
	preview,
}: {
	playing: boolean
	category: keyof typeof categoryColors
	elapsedSeconds: number
	preview(): Promise<void>
}) {
	const { t } = useTranslation()
	const palette = categoryColors[category]
	const seconds = Math.floor(Math.max(0, elapsedSeconds))

	return (
		<Card style={styles.spacing} contentStyle={styles.review}>
			<IconButton
				testID="word-review-play"
				icon={playing ? "pause" : "play"}
				label={t(playing ? "session.pause" : "words.listen")}
				tone={palette.tone}
				round
				color={colors.onAccent}
				onPress={() => void preview()}
			/>
			<View style={styles.description}>
				<Copy>{t("words.listen")}</Copy>
				<Copy style={styles.original}>{t("words.original")}</Copy>
			</View>
			<View style={styles.playback}>
				<View style={styles.waveform}>
					<AudioWaveform
						testID="word-review-waveform"
						animated={playing}
						level={playing ? null : 0}
						color={palette.color}
						height={26}
						barCount={24}
						fill
					/>
				</View>
				<Copy testID="word-review-time" style={styles.time}>
					{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
				</Copy>
			</View>
		</Card>
	)
}

const styles = StyleSheet.create({
	description: { flexGrow: 1, flexShrink: 1, minWidth: 0 },
	playback: { marginLeft: "auto", alignItems: "center", gap: 6 },
	waveform: { width: 96 },
	time: { fontVariant: ["tabular-nums"], fontSize: 14, color: colors.muted },
	spacing: { marginTop: 16 },
	review: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 },
	original: { color: colors.muted, fontSize: 14, marginTop: 5 },
})
