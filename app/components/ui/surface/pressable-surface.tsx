import { useCallback, useMemo } from 'react';

import type { AccessibilityActionEvent } from 'react-native';

import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { depths } from '@/theme';
import { SECOND } from '@/utils/units';

import { Surface, type SurfaceProps } from '@/components/ui/surface';

interface PressPoint {
	x: number;
	y: number;
}

interface Props extends SurfaceProps {
	onPress: (point: PressPoint) => void;
	onLongPress?: () => void;
	onSwipeLeft?: () => void;
	onSwipeRight?: () => void;
	disabled?: boolean;
}

export type PressableSurfaceProps = Props;

export const PressableSurface = ({
	onPress,
	onLongPress,
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
	const reducedMotion = useReducedMotion();

	const pressProgress = useSharedValue(0);

	const pressDistance = Math.max(0, depths[depth] - 1);
	const faceStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: reducedMotion ? 0 : pressProgress.get() * pressDistance }],
	}));

	const activate = useCallback(
		(x = 0, y = 0) => {
			if (!disabled) {
				onPress({ x, y });
			}
		},
		[disabled, onPress],
	);
	const holdActivate = useCallback(() => {
		if (!disabled) {
			onLongPress?.();
		}
	}, [disabled, onLongPress]);

	const pressGesture = useMemo(() => {
		const tap = Gesture.Tap()
			.enabled(!disabled)
			.maxDuration(10 * SECOND)
			.maxDistance(10)
			.onBegin(() => {
				pressProgress.set(withTiming(1, { duration: 60, reduceMotion: ReduceMotion.System }));
			})
			.onEnd((event, success) => {
				if (success) {
					scheduleOnRN(activate, event.x, event.y);
				}
			})
			.onFinalize(() => {
				pressProgress.set(withTiming(0, { duration: 60, reduceMotion: ReduceMotion.System }));
			});

		if (!onLongPress) {
			return tap;
		}

		const longPress = Gesture.LongPress()
			.enabled(!disabled)
			.minDuration(500)
			.onStart(() => {
				scheduleOnRN(holdActivate);
			});

		return Gesture.Exclusive(longPress, tap);
	}, [activate, disabled, holdActivate, onLongPress, pressProgress]);

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
		} else if (event.nativeEvent.actionName === 'longpress') {
			holdActivate();
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
				accessibilityActions={
					onLongPress ? [{ name: 'activate' }, { name: 'longpress' }] : [{ name: 'activate' }]
				}
				onAccessibilityTap={() => activate()}
				onAccessibilityAction={handleAccessibilityAction}
				depth={depth}
				contentStyle={[contentStyle, faceStyle]}
			/>
		</GestureDetector>
	);
};
