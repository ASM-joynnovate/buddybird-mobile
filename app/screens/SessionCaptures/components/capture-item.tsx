import { memo } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Button } from "@/components/ui/button"
import { Chip } from "@/components/ui/chip"
import { Card } from "@/components/ui/surface"
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
			<Copy style={styles.meta}>
				{t("captures.row", {
					cycle: capture.cycle,
					phase: t(capture.phase === "rest" ? "captures.rest" : "captures.learning"),
					time: new Date(capture.capturedAt).toLocaleTimeString(i18n.language, {
						hour12: false,
					}),
					size: (capture.sizeBytes / 1024).toFixed(1),
				})}
			</Copy>
			<View style={styles.summary}>
				<Copy style={styles.description}>
					{t("captures.speech", {
						count: capture.segments.length,
						seconds: (speechMs / 1000).toFixed(1),
					})}
				</Copy>
				<Button
					testID={`capture-full-${capture.id}`}
					label={t(fullPlaying ? "captures.stop" : "captures.playFull")}
					icon={fullPlaying ? "stop" : "play"}
					compact
					variant={fullPlaying ? "primary" : "secondary"}
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
							<Chip
								key={index}
								testID={`capture-segment-${capture.id}-${index}`}
								label={t("captures.segment", {
									index: index + 1,
									start: (segment.startMs / 1000).toFixed(1),
									end: (segment.endMs / 1000).toFixed(1),
								})}
								selected={activeKey === `${capture.id}:${index}`}
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

const styles = StyleSheet.create({
	item: { marginBottom: 16 },
	card: { gap: 14 },
	meta: { fontSize: 13, lineHeight: 20, color: colors.muted },
	summary: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 12 },
	description: { flex: 1, minWidth: 130, lineHeight: 24 },
	timeline: { height: 18, backgroundColor: colors.border, overflow: "hidden" },
	segment: { position: "absolute", top: 0, bottom: 0 },
	segments: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
})
