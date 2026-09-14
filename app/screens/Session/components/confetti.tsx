import { useEffect, useRef, useState } from "react"
import { AccessibilityInfo, Animated, StyleSheet, View } from "react-native"

import { colors } from "@/theme"

export function Confetti() {
	const value = useRef(new Animated.Value(0)).current
	const [reduceMotion, setReduceMotion] = useState(true)

	useEffect(() => {
		void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion)
		const listener = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion)

		return () => listener.remove()
	}, [])

	useEffect(() => {
		if (reduceMotion) {
			return
		}

		const animation = Animated.loop(
			Animated.timing(value, { toValue: 1, duration: 5500, useNativeDriver: true }),
		)

		animation.start()

		return () => animation.stop()
	}, [reduceMotion, value])

	if (reduceMotion) {
		return null
	}

	return (
		<View
			pointerEvents="none"
			style={StyleSheet.absoluteFill}
			accessibilityElementsHidden
			importantForAccessibility="no"
		>
			{Array.from({ length: 12 }, (_, index) => (
				<Animated.View
					key={index}
					style={[
						styles.confetti,
						{
							left: `${index * 8 + 2}%`,
							top: (index % 4) * 90 - 160,
							backgroundColor: [colors.background, colors.blue, "#ffd43b", "#c176ff"][
								index % 4
							],
							transform: [
								{
									translateY: value.interpolate({
										inputRange: [0, 1],
										outputRange: [0, 850],
									}),
								},
								{ rotate: `${index * 47}deg` },
							],
						},
					]}
				/>
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	confetti: { position: "absolute", width: 11, height: 17, borderRadius: 4 },
})
