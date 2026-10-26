import { StyleSheet } from 'react-native';

import Animated, { Extrapolation, interpolate, type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { seedColors } from '@/theme/seed-colors';

const PEAK_MS = 120;
const SQUASH_MS = 60;
const FLOOR_Y = 22;

interface Props {
	elapsed: SharedValue<number>;
	closeProgress: SharedValue<number>;
	startAt: number;
	x: number;
	y: number;
	dx: number;
	dy: number;
	size: number;
	color: string;
}

/**
 * 속씨 부스러기 컴포넌트
 * @param elapsed 애니메이션 경과 시간
 * @param closeProgress 껍질이 닫히는 진행률
 * @param startAt 튀어 오르기 시작하는 시간
 * @param x 시작 가로 위치
 * @param y 시작 세로 위치
 * @param dx 가로 이동 거리
 * @param dy 튀어 오르는 세로 거리
 * @param size 지름
 * @param color 색
 */
const FeedCardLikeButtonCrumb = ({ elapsed, closeProgress, startAt, x, y, dx, dy, size, color }: Props) => {
	const floorDistance = FLOOR_Y - size / 2 - y;
	const landMs = PEAK_MS * (1 + Math.sqrt(1 - floorDistance / dy));

	const crumbStyle = useAnimatedStyle(() => {
		const flightMs = Math.min(Math.max(elapsed.get() - startAt, 0), landMs);
		const squash = interpolate(
			elapsed.get(),
			[startAt + landMs, startAt + landMs + SQUASH_MS * 0.4, startAt + landMs + SQUASH_MS],
			[0, 1, 0.6],
			Extrapolation.CLAMP,
		);
		const scale = interpolate(elapsed.get(), [startAt, startAt + PEAK_MS], [0.4, 1], Extrapolation.CLAMP);
		const scaleY = scale * (1 - 0.35 * squash);

		return {
			opacity:
				interpolate(elapsed.get(), [startAt - 1, startAt], [0, 1], Extrapolation.CLAMP) *
				interpolate(closeProgress.get(), [0, 0.5], [1, 0], Extrapolation.CLAMP),
			transform: [
				{ translateX: (dx * flightMs) / landMs },
				{ translateY: dy * (1 - (1 - flightMs / PEAK_MS) ** 2) + (size * (scale - scaleY)) / 2 },
				{ scaleX: scale * (1 + 0.25 * squash) },
				{ scaleY },
			],
		};
	});

	return (
		<Animated.View
			pointerEvents="none"
			style={[
				styles.crumb,
				{ left: x - size / 2, top: y - size / 2, width: size, height: size, backgroundColor: color },
				crumbStyle,
			]}
		/>
	);
};

const styles = StyleSheet.create({
	crumb: { position: 'absolute', borderRadius: 2.1, borderWidth: 0.6, borderColor: seedColors.kernelEdge },
});

export default FeedCardLikeButtonCrumb;
