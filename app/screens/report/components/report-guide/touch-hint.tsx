import { useEffect } from 'react';

import { type LayoutRectangle, StyleSheet } from 'react-native';

import Animated, {
	cancelAnimation,
	Easing,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';

import { colors, radius } from '@/theme';

const RING_SIZE = 44;
const TAP_MS = 1400;

interface Props {
	target: LayoutRectangle;
}

/**
 * 터치 위치 표시 컴포넌트
 * @param target 강조 영역
 */
const ReportGuideTouchHint = ({ target }: Props) => {
	const motionReduced = useReducedMotion();

	const progress = useSharedValue(0);

	const ringStyle = useAnimatedStyle(() => ({
		opacity: 1 - progress.get(),
		transform: [{ scale: 0.6 + progress.get() * 0.7 }],
	}));

	/** 터치 위치 반복 애니메이션 실행 */
	useEffect(() => {
		if (motionReduced) {
			return;
		}

		progress.set(withRepeat(withTiming(1, { duration: TAP_MS, easing: Easing.inOut(Easing.quad) }), -1));

		return () => cancelAnimation(progress);
	}, [motionReduced, progress]);

	return (
		<Animated.View
			pointerEvents="none"
			style={[
				styles.ring,
				{
					left: target.x + target.width / 2 - RING_SIZE / 2,
					top: target.y + target.height / 2 - RING_SIZE / 2,
				},
				ringStyle,
			]}
		/>
	);
};

const styles = StyleSheet.create({
	ring: {
		position: 'absolute',
		width: RING_SIZE,
		height: RING_SIZE,
		borderWidth: 3,
		borderColor: colors.orange,
		borderRadius: radius.pill,
	},
});

export default ReportGuideTouchHint;
