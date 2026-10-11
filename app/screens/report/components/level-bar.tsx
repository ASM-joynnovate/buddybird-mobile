import { useEffect } from 'react';

import type { StyleProp, ViewStyle } from 'react-native';

import Animated, {
	cancelAnimation,
	Easing,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';

const LOW_SCALE = 0.35;

interface Props {
	playing: boolean;
	duration: number;
	delay: number;
	style: StyleProp<ViewStyle>;
}

/**
 * 재생 중에 오르내리는 소리 막대 컴포넌트
 * @param playing 재생 중 여부
 * @param duration 한 번 오르거나 내리는 시간
 * @param delay 움직이기 시작할 때까지 기다리는 시간
 * @param style 막대 스타일
 */
const LevelBar = ({ playing, duration, delay, style }: Props) => {
	const reducedMotion = useReducedMotion();

	const scale = useSharedValue(1);

	const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: scale.get() }] }));

	/** 재생하는 동안 막대가 오르내림 */
	useEffect(() => {
		if (!playing || reducedMotion) {
			cancelAnimation(scale);
			scale.set(1);

			return;
		}

		scale.set(LOW_SCALE);
		scale.set(
			withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }), -1, true)),
		);
	}, [delay, duration, playing, reducedMotion, scale]);

	return <Animated.View style={[style, scaleStyle]} />;
};

export default LevelBar;
