import { useEffect } from "react"
import { StyleSheet, View } from "react-native"
import Animated, {
	cancelAnimation,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated"

import { colors } from "@/theme"

const pieces = [
	[7, 34, 28, 500, 220, 0],
	[17, 72, -24, 480, -180, 120],
	[27, 24, 30, 520, 260, 260],
	[36, 88, -32, 470, -240, 80],
	[47, 40, 20, 510, 200, 320],
	[58, 68, -28, 490, -260, 180],
	[69, 20, 34, 530, 280, 420],
	[82, 96, -26, 465, -210, 220],
	[92, 50, 18, 505, 240, 520],
	[12, 140, -18, 440, -160, 640],
	[23, 166, 22, 455, 210, 740],
	[74, 150, -22, 445, -190, 700],
	[88, 178, 24, 430, 175, 820],
	[4, 218, 20, 415, -220, 900],
	[52, 214, -20, 420, 190, 960],
	[96, 230, -18, 405, -170, 1020],
]
const palette = [
	colors.yellow,
	colors.onAccent,
	colors.blue,
	colors.error,
	colors.purple,
	colors.yellow,
	colors.onAccent,
	colors.blue,
	colors.error,
	colors.purple,
	colors.blue,
	colors.yellow,
	colors.onAccent,
	colors.error,
	colors.purple,
	colors.blue,
]

function Piece({ index }: { index: number }) {
	const [left, top, drift, distance, rotation, delay] = pieces[index]
	const progress = useSharedValue(0)
	const style = useAnimatedStyle(() => ({
		opacity: progress.get() > 0 ? 1 : 0,
		transform: [
			{ translateY: -28 + distance * progress.get() },
			{ translateX: drift * Math.sin(progress.get() * Math.PI * 2) },
			{ rotate: `${rotation * progress.get()}deg` },
		],
	}))

	useEffect(() => {
		progress.set(
			withRepeat(
				withSequence(
					withDelay(delay, withTiming(1, { duration: 3000 })),
					withTiming(0, { duration: 0 }),
				),
				-1,
			),
		)

		return () => cancelAnimation(progress)
	}, [delay, progress])

	return (
		<Animated.View
			style={[
				styles.piece,
				{ left: `${left}%`, top, backgroundColor: palette[index] },
				style,
			]}
		/>
	)
}

export function Confetti() {
	const reduced = useReducedMotion()

	return reduced ? null : (
		<View
			pointerEvents="none"
			style={StyleSheet.absoluteFill}
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
		>
			{pieces.map((_, index) => (
				<Piece key={index} index={index} />
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	piece: { position: "absolute", width: 10, height: 14, borderRadius: 10 / 3 },
})
