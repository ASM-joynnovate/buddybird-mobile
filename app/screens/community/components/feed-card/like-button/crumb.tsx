import { StyleSheet } from 'react-native';

import Animated, { Extrapolation, interpolate, type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

const FLY_MS = 380;
const FALL_DISTANCE = 6;

interface Props {
	elapsed: SharedValue<number>;
	startAt: number;
	x: number;
	y: number;
	dx: number;
	dy: number;
	size: number;
	color: string;
	shape: 'chip' | 'crumb';
}

/**
 * 껍질 조각 및 부스러기 컴포넌트
 * @param elapsed 애니메이션 경과 시간
 * @param startAt 튀어 오르기 시작하는 시간
 * @param x 시작 가로 위치
 * @param y 시작 세로 위치
 * @param dx 가로 이동 거리
 * @param dy 세로 이동 거리
 * @param size 지름
 * @param color 색
 * @param shape 껍질 조각 또는 속씨 부스러기
 */
const FeedCardLikeButtonCrumb = ({ elapsed, startAt, x, y, dx, dy, size, color, shape }: Props) => {
	const crumbStyle = useAnimatedStyle(() => {
		const range = [startAt, startAt + FLY_MS * 0.45, startAt + FLY_MS];

		return {
			opacity: interpolate(
				elapsed.get(),
				[startAt - 1, startAt, startAt + FLY_MS],
				[0, 1, 0],
				Extrapolation.CLAMP,
			),
			transform: [
				{ translateX: interpolate(elapsed.get(), range, [0, dx * 0.7, dx], Extrapolation.CLAMP) },
				{
					translateY: interpolate(
						elapsed.get(),
						range,
						[0, dy * 0.7, dy + FALL_DISTANCE],
						Extrapolation.CLAMP,
					),
				},
				{
					rotate:
						shape === 'chip'
							? `${interpolate(elapsed.get(), range, [45, 90, 180], Extrapolation.CLAMP)}deg`
							: '0deg',
				},
				{ scale: interpolate(elapsed.get(), range, [0.4, 1, 0.7], Extrapolation.CLAMP) },
			],
		};
	});

	return (
		<Animated.View
			pointerEvents="none"
			style={[
				shape === 'chip' ? styles.chip : styles.crumb,
				{ left: x - size / 2, top: y - size / 2, width: size, height: size, backgroundColor: color },
				crumbStyle,
			]}
		/>
	);
};

const styles = StyleSheet.create({
	chip: { position: 'absolute', borderRadius: 0.5 },
	crumb: { position: 'absolute', borderRadius: 1 },
});

export default FeedCardLikeButtonCrumb;
