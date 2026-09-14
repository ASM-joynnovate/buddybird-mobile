import { useTranslation } from "react-i18next"

import { StyleSheet, View } from "react-native"

import { Card } from "@/components/ui/surface"
import { AudioWaveform } from "@/components/ui/audio-waveform"

import { IconButton } from "@/components/ui/icon-button"
import { Copy } from "@/components/ui/text"
import { colors } from "@/theme"

export function RecordingReview({
	playing,
	elapsedSeconds,
	preview,
}: {
	playing: boolean
	elapsedSeconds: number
	preview(): Promise<void>
}) {
	const { t } = useTranslation()
	const seconds = Math.floor(Math.max(0, elapsedSeconds))
	// ponytail: decorative bars; use audio samples if amplitude becomes product data.
	const level = 0.35 + Math.abs(Math.sin(elapsedSeconds * 8)) * 0.4

	return (
		<Card style={styles.spacing} contentStyle={styles.review}>
			<IconButton
				testID="word-review-play"
				icon={playing ? "pause" : "play"}
				label={t(playing ? "session.pause" : "words.listen")}
				tone="primary"
				round
				color={colors.onAccent}
				onPress={() => void preview()}
			/>
			<View>
				<Copy>{t("words.listen")}</Copy>
				<Copy style={styles.original}>{t("words.original")}</Copy>
			</View>
			<View style={styles.playback}>
				<AudioWaveform
					testID="word-review-waveform"
					active={playing}
					level={level}
					color={colors.orange}
					height={30}
					barCount={9}
					barWidth={3}
				/>
				<Copy testID="word-review-time" style={styles.time}>
					{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
				</Copy>
			</View>
		</Card>
	)
}

const styles = StyleSheet.create({
	playback: { marginLeft: "auto", alignItems: "center", gap: 6 },
	time: { fontVariant: ["tabular-nums"], fontSize: 14, color: colors.muted },
	spacing: { marginTop: 16 },
	review: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 },
	original: { color: colors.muted, fontSize: 14, marginTop: 5 },
})
