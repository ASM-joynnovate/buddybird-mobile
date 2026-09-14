import { memo } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Icon } from "@/components/ui/icon"
import { Card, PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { colors } from "@/theme"
import type { Capture } from "@/types/capture"

export const CaptureItem = memo(function CaptureItem({
	capture,
	activeKey,
	play,
	stop,
}: {
	capture: Capture
	activeKey: string | null
	play(capture: Capture, segmentIndex?: number): Promise<void>
	stop(): void
}) {
	const { t, i18n } = useTranslation()
	const fullKey = `${capture.id}:full`
	const fullPlaying = activeKey === fullKey
	const axisEnd = capture.segments.reduce((end, segment) => Math.max(end, segment.endMs), 1)
	const speechMs = capture.segments.reduce(
		(sum, segment) => sum + segment.endMs - segment.startMs,
		0,
	)

	return (
		<Card contentStyle={styles.card} style={styles.item}>
			<View style={styles.header}>
				<Copy style={styles.cycle}>{t("captures.cycle", { cycle: capture.cycle })}</Copy>
				<Copy style={styles.phase}>
					{t(capture.phase === "rest" ? "captures.rest" : "captures.learning")}
				</Copy>
				<Copy style={styles.meta}>
					{new Date(capture.capturedAt).toLocaleTimeString(i18n.language, {
						hour12: false,
					})}
				</Copy>
				<Copy style={styles.meta}>· {(capture.sizeBytes / 1024).toFixed(0)} KB</Copy>
			</View>
			<View style={styles.summary}>
				<Copy style={styles.description}>
					{t("captures.speech", {
						count: capture.segments.length,
						seconds: (speechMs / 1000).toFixed(1),
					})}
				</Copy>
				<PlaybackButton
					testID={`capture-full-${capture.id}`}
					label={t(fullPlaying ? "captures.stop" : "captures.playFull")}
					active={fullPlaying}
					onPress={() => (fullPlaying ? stop() : void play(capture))}
				/>
			</View>
			{capture.segments.length ? (
				<>
					<View
						style={styles.timeline}
						accessible={false}
						importantForAccessibility="no-hide-descendants"
					>
						{capture.segments.map((segment, index) => (
							<View
								key={index}
								style={[
									styles.segment,
									{
										left: `${(segment.startMs / axisEnd) * 100}%`,
										width: `${((segment.endMs - segment.startMs) / axisEnd) * 100}%`,
										backgroundColor:
											activeKey === `${capture.id}:${index}`
												? colors.orange
												: colors.blue,
									},
								]}
							/>
						))}
					</View>
					<View style={styles.segments}>
						{capture.segments.map((segment, index) => (
							<PlaybackButton
								key={index}
								testID={`capture-segment-${capture.id}-${index}`}
								tone={activeKey === `${capture.id}:${index}` ? "primary" : "blue"}
								label={t("captures.segment", {
									index: index + 1,
									start: (segment.startMs / 1000).toFixed(1),
									end: (segment.endMs / 1000).toFixed(1),
								})}
								active={activeKey === `${capture.id}:${index}`}
								onPress={() =>
									activeKey === `${capture.id}:${index}`
										? stop()
										: void play(capture, index)
								}
							/>
						))}
					</View>
				</>
			) : (
				<Copy style={styles.meta}>{t("captures.noSegments")}</Copy>
			)}
		</Card>
	)
})

function PlaybackButton({
	label,
	active,
	onPress,
	testID,
	tone,
}: {
	label: string
	active: boolean
	onPress(): void
	testID: string
	tone?: "primary" | "blue"
}) {
	return (
		<PressableSurface
			testID={testID}
			onPress={onPress}
			accessibilityLabel={label}
			accessibilityState={{ selected: active }}
			depth={0}
			tone="plain"
			cornerRadius={10}
			hitSlop={6}
			backgroundColor={
				active ? colors.orange : tone ? colors.blueSoft : colors.disabledBackground
			}
			contentStyle={styles.playButton}
		>
			<Icon
				name={active ? "stop" : "play"}
				size={13}
				color={active ? colors.onAccent : colors.blue}
			/>
			<Copy style={[styles.playLabel, active && { color: colors.onAccent }]}>{label}</Copy>
		</PressableSurface>
	)
}

const styles = StyleSheet.create({
	header: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
	cycle: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 10,
		backgroundColor: colors.orangeSoft,
		color: colors.orangeDark,
		fontSize: 12,
	},
	phase: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 10,
		backgroundColor: colors.blueSoft,
		color: colors.blue,
		fontSize: 12,
	},
	playButton: {
		borderWidth: 0,
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 8,
		paddingVertical: 6,
	},
	playLabel: { flexShrink: 1, fontSize: 12 },
	item: { marginBottom: 16 },
	card: { gap: 14 },
	meta: { fontSize: 13, lineHeight: 20, color: colors.muted },
	summary: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 12 },
	description: {
		flexGrow: 1,
		flexShrink: 1,
		flexBasis: "50%",
		minWidth: 0,
		lineHeight: 24,
	},
	timeline: {
		height: 26,
		borderRadius: 10,
		backgroundColor: colors.disabledBackground,
		overflow: "hidden",
	},
	segment: { position: "absolute", top: 3, bottom: 3, minWidth: 3, borderRadius: 3 },
	segments: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
})
