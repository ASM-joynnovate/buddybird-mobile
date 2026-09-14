import { useEffect } from "react"
import { StyleSheet, View } from "react-native"
import Animated, {
	ReduceMotion,
	SharedValue,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated"

type WaveformProps = {
	active: boolean
	level: number
	color: string
	height: number
	barCount: number
	barWidth: number
	testID: string
}

export function AudioWaveform({
	active,
	level,
	color,
	height,
	barCount,
	barWidth,
	testID,
}: WaveformProps) {
	const strength = useSharedValue(0)

	useEffect(() => {
		strength.set(
			withTiming(active ? level : 0, {
				duration: 80,
				reduceMotion: ReduceMotion.System,
			}),
		)
	}, [active, level, strength])

	return (
		<View
			testID={testID}
			style={[styles.waveform, { height, gap: barWidth }]}
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
		>
			{Array.from({ length: barCount }, (_, index) => (
				<WaveBar
					key={index}
					index={index}
					strength={strength}
					color={color}
					height={height}
					width={barWidth}
				/>
			))}
		</View>
	)
}

function WaveBar({
	index,
	strength,
	color,
	height,
	width,
}: {
	index: number
	strength: SharedValue<number>
	color: string
	height: number
	width: number
}) {
	const animation = useAnimatedStyle(() => ({
		transform: [
			{
				scaleY:
					(6 +
						(height - 6) *
							strength.get() *
							(0.3 + 0.7 * Math.abs(Math.sin(index * 1.4)))) /
					height,
			},
		],
	}))

	return (
		<Animated.View style={[styles.bar, { height, width, backgroundColor: color }, animation]} />
	)
}

const styles = StyleSheet.create({
	waveform: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
	bar: { borderRadius: 3 },
})
