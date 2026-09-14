import { PropsWithChildren, useCallback, useMemo } from "react"
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
	ReduceMotion,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated"

import { colors, radius } from "@/theme"

const tones = {
	neutral: { face: colors.background, edge: colors.border },
	primary: { face: colors.orange, edge: colors.orangeDark },
	blue: { face: colors.blue, edge: colors.blueDark },
	selected: { face: colors.orangeSelected, edge: colors.orange },
	plain: { face: "transparent", edge: "transparent" },
	danger: { face: colors.error, edge: colors.error },
	muted: { face: colors.border, edge: colors.border },
} as const

export type SurfaceTone = keyof typeof tones

type SurfaceProps = PropsWithChildren<
	ViewProps & {
		tone?: SurfaceTone
		depth?: number
		cornerRadius?: number
		contentStyle?: StyleProp<ViewStyle>
	}
>

function Surface({
	children,
	tone = "neutral",
	depth = 4,
	cornerRadius = radius.card,
	style,
	contentStyle,
	...props
}: SurfaceProps) {
	const palette = tones[tone]

	return (
		<View
			{...props}
			collapsable={false}
			style={[
				styles.shell,
				{ borderRadius: cornerRadius, paddingBottom: depth },
				style,
			]}
		>
			<View
				pointerEvents="none"
				style={[
					StyleSheet.absoluteFill,
					{ top: depth, backgroundColor: palette.edge, borderRadius: cornerRadius },
				]}
			/>
			<Animated.View
				style={[
					styles.face,
					{
						backgroundColor: palette.face,
						borderColor: palette.edge,
						borderRadius: cornerRadius,
					},
					contentStyle,
				]}
			>
				{children}
			</Animated.View>
		</View>
	)
}

export function Card({ contentStyle, ...props }: SurfaceProps) {
	return <Surface {...props} contentStyle={[styles.card, contentStyle]} />
}

export type PressableSurfaceProps = SurfaceProps & {
	onPress(): void
	disabled?: boolean
}

export function PressableSurface({
	onPress,
	disabled = false,
	depth = 4,
	contentStyle,
	accessibilityState,
	accessibilityRole = "button",
	style,
	...props
}: PressableSurfaceProps) {
	const pressed = useSharedValue(0)
	const activate = useCallback(() => {
		if (!disabled) {
			onPress()
		}
	}, [disabled, onPress])
	const gesture = useMemo(
		() =>
			Gesture.Tap()
				.enabled(!disabled)
				.maxDuration(10_000)
				.maxDistance(10)
				.onBegin(() => {
					pressed.set(withTiming(1, { duration: 90, reduceMotion: ReduceMotion.System }))
				})
				.onEnd((_event, success) => {
					if (success) {
						runOnJS(activate)()
					}
				})
				.onFinalize(() => {
					pressed.set(withTiming(0, { duration: 130, reduceMotion: ReduceMotion.System }))
				}),
		[activate, disabled, pressed],
	)
	const faceAnimation = useAnimatedStyle(() => ({
		transform: [{ translateY: pressed.get() * (depth || 2) }],
	}))

	return (
		<GestureDetector gesture={gesture}>
			<Surface
				{...props}
				style={[style, disabled && { opacity: 0.55 }]}
				accessible
				focusable={!disabled}
				accessibilityRole={accessibilityRole}
				accessibilityState={{ ...accessibilityState, disabled }}
				accessibilityActions={[{ name: "activate" }]}
				onAccessibilityTap={activate}
				onAccessibilityAction={(event) => {
					if (event.nativeEvent.actionName === "activate") {
						activate()
					}
				}}
				depth={depth}
				contentStyle={[contentStyle, faceAnimation]}
			/>
		</GestureDetector>
	)
}

export function ChoiceCard({
	selected,
	contentStyle,
	...props
}: PressableSurfaceProps & { selected: boolean }) {
	return (
		<PressableSurface
			{...props}
			tone={selected ? "selected" : "neutral"}
			accessibilityRole="radio"
			accessibilityState={{ checked: selected }}
			contentStyle={[styles.card, contentStyle]}
		/>
	)
}

const styles = StyleSheet.create({
	shell: { borderCurve: "continuous" },
	face: { flexGrow: 1, borderWidth: 2, borderCurve: "continuous" },
	card: { padding: 16 },
})
