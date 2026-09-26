import { useEffect } from "react"
import { StyleSheet, View } from "react-native"
import Animated, {
	Easing,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from "react-native-reanimated"

import { CheckMark } from "@/components/ui/check-mark"
import { PressableSurface } from "@/components/ui/surface"
import { colors } from "@/theme"

const CHECK_DEPTH = 3

interface Props {
	checked: boolean
	disabled?: boolean
	onPress(): void
}

export function CheckBox({ checked, disabled, onPress }: Props) {
	const reduced = useReducedMotion()

	const pop = useSharedValue(1)
	const mark = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }] }))

	useEffect(() => {
		if (checked && !reduced) {
			pop.set(0.7)
			pop.set(withTiming(1, { duration: 160, easing: Easing.out(Easing.cubic) }))
		}
	}, [checked, reduced, pop])

	let tone: "primary" | "neutral" | "muted" = checked ? "primary" : "neutral"

	if (disabled) {
		tone = "muted"
	}

	return (
		<View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
			<PressableSurface
				onPress={onPress}
				disabled={disabled}
				tone={tone}
				depth={disabled ? 0 : CHECK_DEPTH}
				cornerRadius={8}
				style={[styles.box, disabled && { marginTop: CHECK_DEPTH }]}
				contentStyle={styles.boxFace}
			>
				<Animated.View style={mark}>
					<CheckMark
						size="small"
						color={checked && !disabled ? colors.onAccent : colors.disabled}
					/>
				</Animated.View>
			</PressableSurface>
		</View>
	)
}

const styles = StyleSheet.create({
	box: { width: 26 },
	boxFace: { width: 26, height: 26, alignItems: "center", justifyContent: "center" },
})
