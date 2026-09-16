import { useTranslation } from "react-i18next"
import { ActivityIndicator, StyleSheet, View } from "react-native"

import { AudioWaveform } from "@/components/ui/audio-waveform"
import { IconButton } from "@/components/ui/icon-button"
import { Card } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { meteringLevel } from "@/lib/audio-waveform"
import { categoryColors, colors, font } from "@/theme"

export function RecordingPanel({
	label,
	category,
	isRecording,
	durationMillis,
	metering,
	recorded,
	busy,
	toggleRecording,
}: {
	label: string
	category: keyof typeof categoryColors
	isRecording: boolean
	durationMillis: number
	metering?: number
	recorded: boolean
	busy: boolean
	toggleRecording(): Promise<void>
}) {
	const { t } = useTranslation()
	const palette = categoryColors[category]
	const seconds = Math.floor(durationMillis / 1000)
	const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
	let recordingStatusText: string

	if (isRecording) {
		recordingStatusText = t("words.recordingTime", { time: clock })
	} else if (recorded) {
		recordingStatusText = t("words.recorded")
	} else {
		recordingStatusText = t("words.tapToRecord")
	}

	return (
		<Card
			tone={palette.tone}
			cornerRadius={22}
			depth={4}
			style={styles.spacing}
			contentStyle={styles.recordingCard}
		>
			<Copy style={styles.targetLabel}>{t("words.target")}</Copy>
			<Copy style={styles.target}>
				{label.trim() ? `“${label.trim()}”` : t("words.newWord")}
			</Copy>
			<View style={styles.waveform}>
				<AudioWaveform
					testID="recording-waveform"
					level={isRecording ? meteringLevel(metering) : 0}
					color={colors.onAccent}
					height={48}
					barCount={48}
					fill
				/>
			</View>
			<View style={styles.recordButton}>
				<IconButton
					testID="word-record"
					icon={isRecording ? "stop" : "mic"}
					label={t(isRecording ? "words.stopRecording" : "words.record")}
					onPress={() => void toggleRecording()}
					disabled={busy}
					size={80}
					iconSize={isRecording ? 26 : 34}
					tone={isRecording ? "danger" : "neutral"}
					round
					color={isRecording ? colors.background : palette.color}
				/>
				{busy ? <ActivityIndicator style={styles.busy} color={colors.onAccent} /> : null}
			</View>
			<Copy accessibilityLiveRegion="polite" style={styles.recordingStatus}>
				{recordingStatusText}
			</Copy>
		</Card>
	)
}

const styles = StyleSheet.create({
	spacing: { marginTop: 18 },
	recordingCard: {
		alignItems: "center",
		paddingHorizontal: 24,
		paddingTop: 24,
		paddingBottom: 24,
	},
	targetLabel: { fontSize: 12, color: colors.onAccent },
	target: {
		fontFamily: font.black,
		fontSize: 34,
		lineHeight: 40,
		textAlign: "center",
		marginTop: 12,
		color: colors.onAccent,
	},
	waveform: { marginVertical: 16, width: "100%" },
	recordButton: { position: "relative" },
	busy: { position: "absolute", right: -18, top: 25 },
	recordingStatus: {
		color: colors.onAccent,
		fontSize: 13,
		textAlign: "center",
		marginTop: 18,
		lineHeight: 20,
	},
})
