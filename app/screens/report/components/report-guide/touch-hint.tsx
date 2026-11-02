import { useEffect } from 'react';

import { type LayoutRectangle, StyleSheet } from 'react-native';

import type { ReportGuideGesture } from '@/types/guide/report';

import Animated, {
	cancelAnimation,
	Easing,
	Extrapolation,
	interpolate,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';

import { colors, radius } from '@/theme';

const RING_SIZE = 44;
const TAP_MS = 1400;
const SCRUB_MS = 2600;

interface Props {
	target: LayoutRectangle;
	gesture: ReportGuideGesture;
}

/**
 * 터치 위치 및 방향 표시 컴포넌트
 * @param target 강조 영역
 * @param gesture 강조 영역에서 할 동작
 */
const ReportGuideTouchHint = ({ target, gesture }: Props) => {
	const motionReduced = useReducedMotion();

	const progress = useSharedValue(0);

	const scrubbing = gesture === 'scrub';
	const slideDistance = target.width * 0.4;

	const ringStyle = useAnimatedStyle(() => {
		const ringProgress = progress.get();

		if (scrubbing) {
			return {
				opacity: interpolate(ringProgress, [0, 0.12, 0.8, 0.92], [0, 1, 1, 0], Extrapolation.CLAMP),
				transform: [
					{ translateX: interpolate(ringProgress, [0.3, 0.8], [0, slideDistance], Extrapolation.CLAMP) },
					{ scale: interpolate(ringProgress, [0, 0.12, 0.3], [1.2, 1, 0.8], Extrapolation.CLAMP) },
				],
			};
		}

		return { opacity: 1 - ringProgress, transform: [{ scale: 0.6 + ringProgress * 0.7 }] };
	});

	/** 터치 위치 반복 애니메이션 실행 */
	useEffect(() => {
		if (motionReduced) {
			return;
		}

		progress.set(
			withRepeat(
				withTiming(1, { duration: scrubbing ? SCRUB_MS : TAP_MS, easing: Easing.inOut(Easing.quad) }),
				-1,
			),
		);

		return () => cancelAnimation(progress);
	}, [motionReduced, progress, scrubbing]);

	return (
		<Animated.View
			pointerEvents="none"
			style={[
				styles.ring,
				{
					left: target.x + (scrubbing ? target.width * 0.25 : target.width / 2) - RING_SIZE / 2,
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
