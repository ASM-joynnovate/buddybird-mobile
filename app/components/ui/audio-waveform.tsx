import { memo, useEffect } from "react"
import { StyleSheet, View } from "react-native"
import Animated, {
	type SharedValue,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from "react-native-reanimated"

import { liveTargets, loopTargets } from "@/lib/audio-waveform"

const LIVE_MS = 80
const LOOP_MS = 200
const MIN_RATIO = 0.1

export function AudioWaveform({
	color,
	height,
	barCount,
	fill = false,
	level,
	animated = false,
	testID,
}: {
	color: string
	height: number
	barCount: number
	fill?: boolean
	level?: number | null
	animated?: boolean
	testID: string
}) {
	const reduced = useReducedMotion()
	const targets = useSharedValue<number[]>(Array(barCount).fill(0))
	const duration = useSharedValue(LOOP_MS)

	useEffect(() => {
		if (typeof level === "number") {
			duration.set(reduced ? 0 : LIVE_MS)
			targets.set(liveTargets(level, barCount))

			return undefined
		}

		if (animated && !reduced) {
			const tick = () => {
				duration.set(LOOP_MS)
				targets.set(loopTargets(barCount))
			}

			tick()

			const timer = setInterval(tick, LOOP_MS)

			return () => clearInterval(timer)
		}

		duration.set(reduced ? 0 : LOOP_MS)
		targets.set(Array(barCount).fill(0))

		return undefined
	}, [animated, barCount, duration, level, reduced, targets])

	return (
		<View
			testID={testID}
			style={[styles.waveform, fill && styles.fill, { height }]}
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
		>
			{Array.from({ length: barCount }, (_, index) => (
				<WaveBar
					key={index}
					index={index}
					targets={targets}
					duration={duration}
					color={color}
					height={height}
					fill={fill}
				/>
			))}
		</View>
	)
}

const WaveBar = memo(function WaveBar({
	index,
	targets,
	duration,
	color,
	height,
	fill,
}: {
	index: number
	targets: SharedValue<number[]>
	duration: SharedValue<number>
	color: string
	height: number
	fill: boolean
}) {
	const animation = useAnimatedStyle(() => ({
		height: withTiming(height * (MIN_RATIO + (1 - MIN_RATIO) * targets.get()[index]), {
			duration: duration.get(),
		}),
	}))

	return (
		<Animated.View
			style={[
				styles.bar,
				fill ? styles.fillBar : styles.fixedBar,
				{ backgroundColor: color },
				animation,
			]}
		/>
	)
})

const styles = StyleSheet.create({
	waveform: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		gap: 3,
	},
	fill: { width: "100%" },
	bar: { borderRadius: 2 },
	fixedBar: { width: 4 },
	fillBar: { flex: 1, minWidth: 1 },
})
