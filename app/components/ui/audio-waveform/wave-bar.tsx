import { memo } from "react"
import { StyleSheet } from "react-native"
import Animated, { type SharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated"

const MIN_RATIO = 0.1

interface Props {
	index: number
	targets: SharedValue<number[]>
	duration: SharedValue<number>
	color: string
	height: number
	fill: boolean
}

export const WaveBar = memo(function WaveBar({
	index,
	targets,
	duration,
	color,
	height,
	fill,
}: Props) {
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
	bar: { borderRadius: 2 },
	fixedBar: { width: 4 },
	fillBar: { flex: 1, minWidth: 1 },
})
