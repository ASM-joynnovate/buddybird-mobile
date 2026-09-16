import { useTranslation } from "react-i18next"

import { useEffect, useRef } from "react"
import Animated, {
	cancelAnimation,
	Easing,
	useReducedMotion,
	useAnimatedProps,
	useSharedValue,
	withTiming,
} from "react-native-reanimated"
import { StyleSheet, View } from "react-native"

import Svg, { Circle } from "react-native-svg"

import { Mascot } from "@/components/mascot"
import { Copy } from "@/components/ui/text"
import { colors, font } from "@/theme"
import type  { SessionSnapshot } from "@modules/session-audio-engine"

const ProgressCircle = Animated.createAnimatedComponent(Circle)

export function SessionRing({
	phase,
	cycle,
	wordLabel,
	timer,
	progress,
	running,
	phaseDurationMs,
	remainingMs,
}: {
	phase: SessionSnapshot["phase"]
	cycle: number
	wordLabel?: string
	timer: string
	progress: number
	running: boolean
	phaseDurationMs: number
	remainingMs: number
}) {
	const { t } = useTranslation()
	const learning = phase === "learning"
	const accent = learning ? colors.orange : colors.blue
	let phaseTitle = wordLabel

	if (phase === "rest") {
		phaseTitle = t("session.rest")
	} else if (phase === "stress-care") {
		phaseTitle = t("session.care")
	}

	const size = 252
	const radius = (size - 18) / 2
	const circumference = Math.PI * 2 * radius
	const reduced = useReducedMotion()
	const offset = useSharedValue(circumference * (1 - progress))
	const animatedSegment = useRef<string | null>(null)
	const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: offset.get() }))

	useEffect(() => {
		const segment = `${cycle}:${phase}:${phaseDurationMs}`
		const animate = running && !reduced && phaseDurationMs > 0 && remainingMs > 0

		if (animate && animatedSegment.current === segment) {
			return
		}

		animatedSegment.current = animate ? segment : null
		const current = circumference * (1 - progress)

		offset.set(current)

		if (animate) {
			offset.set(
				withTiming(Math.max(0, current - (circumference * remainingMs) / phaseDurationMs), {
					duration: remainingMs,
					easing: Easing.linear,
				}),
			)
		}
	}, [
		circumference,
		cycle,
		offset,
		phase,
		phaseDurationMs,
		progress,
		reduced,
		remainingMs,
		running,
	])

	useEffect(() => () => cancelAnimation(offset), [offset])

	const sessionLabel = (
		<View style={styles.label}>
			<Copy
				numberOfLines={learning ? 1 : 2}
				adjustsFontSizeToFit
				minimumFontScale={0.5}
				ellipsizeMode="tail"
				style={[styles.phaseTitle, !learning && styles.restTitle]}
			>
				{phaseTitle}
			</Copy>
			<Copy testID="session-countdown" style={styles.timer}>
				{timer}
			</Copy>
		</View>
	)

	return (
		<View style={styles.middle}>
			<View style={styles.ring}>
				<View style={styles.frame}>
					<Svg
						style={StyleSheet.absoluteFill}
						width="100%"
						height="100%"
						viewBox={`0 0 ${size} ${size}`}
						accessibilityElementsHidden
						importantForAccessibility="no"
					>
						<Circle
							cx={size / 2}
							cy={size / 2}
							r={radius}
							fill="none"
							stroke={colors.border}
							strokeWidth={18}
						/>
						<ProgressCircle
							cx={size / 2}
							cy={size / 2}
							r={radius}
							fill="none"
							stroke={accent}
							strokeWidth={18}
							strokeLinecap="round"
							strokeDasharray={`${circumference} ${circumference}`}
							animatedProps={animatedProps}
							rotation={-90}
							origin={`${size / 2}, ${size / 2}`}
						/>
					</Svg>
					<View style={styles.ringContent}>
						<Mascot size={90} motion="bounce" />
						{sessionLabel}
					</View>
				</View>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	ring: { width: "100%", maxWidth: 252 },
	frame: { width: "100%", aspectRatio: 1 },
	label: { width: "68%", minWidth: 0 },
	middle: {
		flexGrow: 1,
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
		marginVertical: 12,
	},
	ringContent: {
		...StyleSheet.absoluteFillObject,
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
	},
	phaseTitle: { fontSize: 30, fontFamily: font.black, textAlign: "center" },
	restTitle: { fontSize: 22 },
	timer: {
		fontSize: 22,
		fontFamily: font.black,
		marginTop: 8,
		fontVariant: ["tabular-nums"],
		alignSelf: "center",
		textAlign: "center",
	},
})
