import { useTranslation } from "react-i18next"

import { StyleSheet, View } from "react-native"

import { AudioWaveform } from "@/components/ui/audio-waveform"

import { usePlaybackMetering } from "@/hooks/use-playback-metering"
import { meteringLevel } from "@/lib/audio-waveform"

import { Copy } from "@/components/ui/text"
import { colors, radius } from "@/theme"
import type { SessionSnapshot } from "@modules/session-audio-engine"

export function SessionStatus({ snapshot }: { snapshot: SessionSnapshot }) {
	const { t } = useTranslation()
	const paused = snapshot.state === "paused" || snapshot.state === "interrupted"
	const learning = snapshot.phase === "learning"
	const playing = snapshot.state === "running" && learning && snapshot.isTargetPlaying
	const decibels = usePlaybackMetering(playing)
	const accent = learning ? colors.orange : colors.blue
	let statusKey = "session.waiting"

	if (snapshot.state === "interrupted") {
		statusKey = "session.interrupted"
	} else if (paused) {
		statusKey = "session.paused"
	} else if (snapshot.isTargetPlaying) {
		statusKey = "session.playing"
	}

	let phaseHintKey = snapshot.phase === "rest" ? "session.restHint" : "session.careHint"

	if (paused) {
		phaseHintKey = snapshot.state === "interrupted" ? "session.interrupted" : "session.paused"
	}

	return (
		<>
			{learning ? (
				<>
					<View style={styles.waveform}>
						<AudioWaveform
							testID="session-waveform"
							active={playing}
							level={meteringLevel(decibels)}
							color={accent}
							height={36}
							barCount={33}
							barWidth={4}
						/>
					</View>
					<Copy
						style={[
							styles.status,
							{ backgroundColor: paused ? colors.surface : colors.orangeSoft },
						]}
					>
						{t(statusKey)}
					</Copy>
				</>
			) : (
				<Copy style={styles.phaseHint}>{t(phaseHintKey)}</Copy>
			)}
		</>
	)
}

const styles = StyleSheet.create({
	waveform: { marginBottom: 16 },
	status: {
		alignSelf: "center",
		paddingVertical: 11,
		paddingHorizontal: 18,
		borderRadius: radius.pill,
		fontSize: 14,
		textAlign: "center",
	},
	phaseHint: { textAlign: "center", color: colors.muted, lineHeight: 25, marginBottom: 8 },
})
