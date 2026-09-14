import { useEffect } from "react"
import { Image, StyleSheet } from "react-native"
import { useTranslation } from "react-i18next"
import Animated, {
	cancelAnimation,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated"

import { mascot } from "@/theme"

export function Mascot({
	size = 120,
	motion = "float",
}: {
	size?: number
	motion?: "float" | "bounce"
}) {
	const { t } = useTranslation()
	const reduced = useReducedMotion()
	const y = useSharedValue(0)
	const rotation = useSharedValue(0)
	const style = useAnimatedStyle(() => ({
		transform: [{ translateY: y.get() }, { rotate: `${rotation.get()}deg` }],
	}))

	useEffect(() => {
		if (reduced) {
			return
		}

		const duration = motion === "bounce" ? 800 : 1000

		y.set(
			withRepeat(
				withSequence(
					withTiming(-size * (motion === "bounce" ? 0.08 : 0.05), { duration }),
					withTiming(0, { duration }),
				),
				-1,
			),
		)
		rotation.set(
			withRepeat(
				withSequence(
					withTiming(-2, { duration }),
					withTiming(2, { duration }),
					withTiming(0, { duration }),
				),
				-1,
			),
		)

		return () => {
			cancelAnimation(y)
			cancelAnimation(rotation)
		}
	}, [motion, reduced, rotation, size, y])

	return (
		<Animated.View
			accessible
			accessibilityRole="image"
			accessibilityLabel={t("common.mascot")}
			style={[styles.frame, { width: size }, style]}
		>
			<Image
				source={mascot}
				resizeMode="contain"
				style={[StyleSheet.absoluteFill, styles.image]}
			/>
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	frame: { maxWidth: "100%", aspectRatio: 1, flexShrink: 0 },
	image: { width: "100%", height: "100%" },
})
