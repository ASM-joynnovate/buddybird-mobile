import { useEffect } from "react"
import { StyleSheet, View } from "react-native"
import Animated, {
	cancelAnimation,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated"

import { colors } from "@/theme"

const DURATION = 1800

const pieces = [
	[7, 34, 28, 500, 220, 0],
	[17, 72, -24, 480, -180, 60],
	[27, 24, 30, 520, 260, 130],
	[36, 88, -32, 470, -240, 40],
	[47, 40, 20, 510, 200, 160],
	[58, 68, -28, 490, -260, 90],
	[69, 20, 34, 530, 280, 210],
	[82, 96, -26, 465, -210, 110],
	[92, 50, 18, 505, 240, 260],
	[12, 140, -18, 440, -160, 320],
	[23, 166, 22, 455, 210, 370],
	[74, 150, -22, 445, -190, 350],
	[88, 178, 24, 430, 175, 410],
	[4, 218, 20, 415, -220, 450],
	[52, 214, -20, 420, 190, 480],
	[96, 230, -18, 405, -170, 510],
]

const tones = [
	{ face: colors.yellow, edge: colors.yellowDark },
	{ face: colors.purple, edge: colors.purpleDark },
]

function Piece({ index }: { index: number }) {
	const [left, top, drift, distance, rotation, delay] = pieces[index]
	const tone = tones[index % tones.length]
	const progress = useSharedValue(0)
	const style = useAnimatedStyle(() => ({
		opacity: progress.get() > 0 && progress.get() < 1 ? 1 : 0,
		transform: [
			{ translateY: -28 + distance * progress.get() },
			{ translateX: drift * Math.sin(progress.get() * Math.PI * 2) },
			{ rotate: `${rotation * progress.get()}deg` },
		],
	}))

	useEffect(() => {
		progress.set(withDelay(delay, withTiming(1, { duration: DURATION })))

		return () => cancelAnimation(progress)
	}, [delay, progress])

	return (
		<Animated.View
			style={[
				styles.piece,
				{ left: `${left}%`, top, backgroundColor: tone.face, borderColor: tone.edge },
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
	piece: {
		position: "absolute",
		width: 10,
		height: 14,
		borderRadius: 10 / 3,
		borderBottomWidth: 3,
	},
})
