import { useTranslation } from "react-i18next"

import { StyleSheet, View } from "react-native"

import { AudioWaveform } from "@/components/ui/audio-waveform"

import { usePlaybackMetering } from "@/hooks/use-playback-metering"
import { meteringLevel } from "@/lib/audio-waveform"

import { Icon } from "@/components/ui/icon"
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

	if (snapshot.state === "starting") {
		statusKey = "session.preparing"
	} else if (snapshot.state === "interrupted") {
		statusKey = "session.interrupted"
	} else if (paused) {
		statusKey = "session.paused"
	} else if (snapshot.isTargetPlaying) {
		statusKey = "session.playing"
	}

	if (!learning) {
		return null
	}

	return (
		<>
			<View style={styles.waveform}>
				<AudioWaveform
					testID="session-waveform"
					active={playing}
					level={meteringLevel(decibels)}
					color={accent}
					height={44}
					barCount={38}
					barWidth={4}
				/>
			</View>
			<View
				style={[
					styles.status,
					{ backgroundColor: playing ? colors.orangeSoft : colors.surface },
				]}
			>
				<Icon
					name={playing ? "volume" : paused ? "pause" : "mic"}
					size={15}
					color={playing ? accent : colors.muted}
				/>
				<Copy style={styles.statusText}>{t(statusKey)}</Copy>
			</View>
		</>
	)
}

const styles = StyleSheet.create({
	waveform: { marginBottom: 16 },
	status: {
		alignSelf: "center",
		paddingVertical: 6,
		paddingHorizontal: 14,
		borderRadius: radius.pill,
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	statusText: { fontSize: 12, color: colors.muted },
})
