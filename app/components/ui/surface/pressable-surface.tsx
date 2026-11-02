import { useCallback, useMemo } from 'react';

import type { AccessibilityActionEvent } from 'react-native';

import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { MINUTE, SECOND } from '@/config/units';
import { depths } from '@/theme';

import { Surface, type SurfaceProps } from '@/components/ui/surface';

const HOLD_MAX_DISTANCE = 100;

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

	const pressDistance = Math.max(0, depths[depth] - 1);
	const faceStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: motionReduced ? 0 : pressProgress.get() * pressDistance }],
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
					pressProgress.set(withTiming(1, { duration: 60, reduceMotion: ReduceMotion.System }));

					if (onPressIn) {
						scheduleOnRN(onPressIn);
					}
				})
				.onEnd((event, tapSucceeded) => {
					if (tapSucceeded) {
						scheduleOnRN(activate, event.x, event.y);
					}
				})
				.onFinalize(() => {
					pressProgress.set(withTiming(0, { duration: 60, reduceMotion: ReduceMotion.System }));

					if (onPressOut) {
						scheduleOnRN(onPressOut);
					}
				}),
		[activate, disabled, onPressIn, onPressOut, pressProgress],
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
				contentStyle={[contentStyle, faceStyle]}
			/>
		</GestureDetector>
	);
};
