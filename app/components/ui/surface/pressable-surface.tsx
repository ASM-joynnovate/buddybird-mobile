import { useCallback, useMemo } from "react"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import {
	ReduceMotion,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets"

import { Surface, type SurfaceProps } from "@/components/ui/surface/surface"
import { depths } from "@/theme"

type PressPoint = { x: number; y: number }

interface Props extends SurfaceProps {
	onPress(point: PressPoint): void
	onLongPress?(): void
	disabled?: boolean
}

export type PressableSurfaceProps = Props

export function PressableSurface({
	onPress,
	onLongPress,
	disabled = false,
	depth = "high",
	contentStyle,
	accessibilityState,
	accessibilityRole = "button",
	style,
	...props
}: Props) {
	const reduced = useReducedMotion()

	const pressed = useSharedValue(0)

	const activate = useCallback(
		(x = 0, y = 0) => {
			if (!disabled) {
				onPress({ x, y })
			}
		},
		[disabled, onPress],
	)
	const holdActivate = useCallback(() => {
		if (!disabled) {
			onLongPress?.()
		}
	}, [disabled, onLongPress])

	const gesture = useMemo(() => {
		const tap = Gesture.Tap()
			.enabled(!disabled)
			.maxDuration(10_000)
			.maxDistance(10)
			.onBegin(() => {
				pressed.set(withTiming(1, { duration: 60, reduceMotion: ReduceMotion.System }))
			})
			.onEnd((event, success) => {
				if (success) {
					scheduleOnRN(activate, event.x, event.y)
				}
			})
			.onFinalize(() => {
				pressed.set(withTiming(0, { duration: 60, reduceMotion: ReduceMotion.System }))
			})

		if (!onLongPress) {
			return tap
		}

		const hold = Gesture.LongPress()
			.enabled(!disabled)
			.minDuration(500)
			.onStart(() => {
				scheduleOnRN(holdActivate)
			})

		return Gesture.Exclusive(hold, tap)
	}, [activate, disabled, holdActivate, onLongPress, pressed])

	const pressDistance = Math.max(0, depths[depth] - 1)
	const faceAnimation = useAnimatedStyle(() => ({
		transform: [{ translateY: reduced ? 0 : pressed.get() * pressDistance }],
	}))

	return (
		<GestureDetector gesture={gesture}>
			<Surface
				{...props}
				style={style}
				accessible
				focusable={!disabled}
				accessibilityRole={accessibilityRole}
				accessibilityState={{ ...accessibilityState, disabled }}
				accessibilityActions={
					onLongPress
						? [{ name: "activate" }, { name: "longpress" }]
						: [{ name: "activate" }]
				}
				onAccessibilityTap={() => activate()}
				onAccessibilityAction={(event) => {
					if (event.nativeEvent.actionName === "activate") {
						activate()
					} else if (event.nativeEvent.actionName === "longpress") {
						holdActivate()
					}
				}}
				depth={depth}
				contentStyle={[contentStyle, faceAnimation]}
			/>
		</GestureDetector>
	)
}
