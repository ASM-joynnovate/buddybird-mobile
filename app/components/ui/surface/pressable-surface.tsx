import { useCallback, useMemo } from 'react';

import type { AccessibilityActionEvent } from 'react-native';

import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { MINUTE, SECOND } from '@/config/units';
import { depths } from '@/theme';

import { Surface, type SurfaceProps } from '@/components/ui/surface';

const HOLD_MAX_DISTANCE = 100;
const PRESS_IN_DELAY_MS = 100;
const PRESS_MS = 60;

interface PressPoint {
	x: number;
	y: number;
}

interface Props extends SurfaceProps {
	onPress?: (point: PressPoint) => void;
	onPressIn?: () => void;
	onPressOut?: () => void;
	onSwipeLeft?: () => void;
	onSwipeRight?: () => void;
	disabled?: boolean;
}

export type PressableSurfaceProps = Props;

export const PressableSurface = ({
	onPress,
	onPressIn,
	onPressOut,
	onSwipeLeft,
	onSwipeRight,
	disabled = false,
	depth = 'medium',
	contentStyle,
	accessibilityState,
	accessibilityRole = 'button',
	style,
	...props
}: Props) => {
	const motionReduced = useReducedMotion();

	const pressProgress = useSharedValue(0);
	const pressInTimer = useSharedValue<ReturnType<typeof setTimeout> | null>(null);

	const pressDistance = Math.max(0, depths[depth] - 1);
	const pressAnimated = pressDistance > 0 && !motionReduced;
	const faceStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: pressProgress.get() * pressDistance }],
	}));

	const activate = useCallback(
		(x = 0, y = 0) => {
			if (!disabled) {
				onPress?.({ x, y });
			}
		},
		[disabled, onPress],
	);

	const pressGesture = useMemo(
		() =>
			Gesture.Tap()
				.enabled(!disabled)
				// 누르는 동안 유지
				.maxDuration(onPressIn ? 10 * MINUTE : 10 * SECOND)
				.maxDistance(onPressIn ? HOLD_MAX_DISTANCE : 10)
				.onBegin(() => {
					if (pressAnimated) {
						pressInTimer.set(
							setTimeout(
								() => {
									pressInTimer.set(null);
									pressProgress.set(withTiming(1, { duration: PRESS_MS }));
								},
								onPressIn ? 0 : PRESS_IN_DELAY_MS,
							),
						);
					}

					if (onPressIn) {
						scheduleOnRN(onPressIn);
					}
				})
				.onEnd((event, tapSucceeded) => {
					if (tapSucceeded) {
						scheduleOnRN(activate, event.x, event.y);
					}
				})
				.onFinalize((_event, success) => {
					const timer = pressInTimer.get();

					if (timer !== null) {
						clearTimeout(timer);
						pressInTimer.set(null);
					}

					pressProgress.set(
						timer !== null && success
							? withSequence(withTiming(1, { duration: PRESS_MS }), withTiming(0, { duration: PRESS_MS }))
							: withTiming(0, { duration: PRESS_MS }),
					);

					if (onPressOut) {
						scheduleOnRN(onPressOut);
					}
				}),
		[activate, disabled, onPressIn, onPressOut, pressAnimated, pressInTimer, pressProgress],
	);

	const gesture = useMemo(() => {
		const swipes = [];

		if (onSwipeLeft) {
			swipes.push(
				Gesture.Fling()
					.enabled(!disabled)
					.direction(Directions.LEFT)
					.onStart(() => {
						scheduleOnRN(onSwipeLeft);
					}),
			);
		}

		if (onSwipeRight) {
			swipes.push(
				Gesture.Fling()
					.enabled(!disabled)
					.direction(Directions.RIGHT)
					.onStart(() => {
						scheduleOnRN(onSwipeRight);
					}),
			);
		}

		return swipes.length > 0 ? Gesture.Race(...swipes, pressGesture) : pressGesture;
	}, [disabled, onSwipeLeft, onSwipeRight, pressGesture]);

	const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
		if (event.nativeEvent.actionName === 'activate') {
			activate();
		}
	};

	return (
		<GestureDetector gesture={gesture}>
			<Surface
				{...props}
				style={style}
				accessible
				focusable={!disabled}
				accessibilityRole={accessibilityRole}
				accessibilityState={{ ...accessibilityState, disabled }}
				accessibilityActions={[{ name: 'activate' }]}
				onAccessibilityTap={() => activate()}
				onAccessibilityAction={handleAccessibilityAction}
				depth={depth}
				contentStyle={pressAnimated ? [contentStyle, faceStyle] : contentStyle}
			/>
		</GestureDetector>
	);
};
