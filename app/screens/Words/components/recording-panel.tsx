import { useTranslation } from "react-i18next"

import { ActivityIndicator, StyleSheet, View } from "react-native"

import { AudioWaveform } from "@/components/ui/audio-waveform"
import { meteringLevel } from "@/lib/audio-waveform"

import { Card } from "@/components/ui/surface"

import { IconButton } from "@/components/ui/icon-button"
import { Copy } from "@/components/ui/text"
import { colors, font, radius } from "@/theme"

export function RecordingPanel({
	label,
	isRecording,
	durationMillis,
	metering,
	recorded,
	busy,
	toggleRecording,
}: {
	label: string
	isRecording: boolean
	durationMillis: number
	metering?: number
	recorded: boolean
	busy: boolean
	toggleRecording(): Promise<void>
}) {
	const { t } = useTranslation()
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
			tone="primary"
			cornerRadius={radius.hero}
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
					active={isRecording}
					level={meteringLevel(metering)}
					color={isRecording ? colors.onAccent : colors.orangeSoft}
					height={48}
					barCount={23}
					barWidth={5}
				/>
			</View>
			<View style={styles.recordButton}>
				<IconButton
					testID="word-record"
					icon={isRecording ? "stop" : "mic"}
					label={t(isRecording ? "words.stopRecording" : "words.record")}
					onPress={() => void toggleRecording()}
					disabled={busy}
					size={82}
					tone={isRecording ? "danger" : "neutral"}
					round
					color={isRecording ? colors.background : colors.orange}
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
	spacing: { marginTop: 24 },
	recordingCard: {
		alignItems: "center",
		paddingHorizontal: 20,
		paddingTop: 28,
		paddingBottom: 24,
	},
	targetLabel: { fontSize: 20, color: colors.onAccent },
	target: {
		fontFamily: font.black,
		fontSize: 32,
		textAlign: "center",
		marginTop: 12,
		color: colors.onAccent,
	},
	waveform: { marginVertical: 16 },
	recordButton: { position: "relative" },
	busy: { position: "absolute", right: -18, top: 25 },
	recordingStatus: {
		color: colors.onAccent,
		fontSize: 20,
		textAlign: "center",
		marginTop: 18,
		lineHeight: 28,
	},
})
