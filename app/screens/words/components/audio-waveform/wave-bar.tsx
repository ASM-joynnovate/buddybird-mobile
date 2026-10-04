import { memo } from 'react';

import { StyleSheet } from 'react-native';

import Animated, { type SharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const MIN_HEIGHT_RATIO = 0.1;

interface Props {
	index: number;
	heightRatios: SharedValue<number[]>;
	duration: SharedValue<number>;
	color: string;
	height: number;
}

/**
 * 파형 막대 컴포넌트
 * @param index 파형 안의 막대 순서
 * @param heightRatios 막대별 높이 비율
 * @param duration 높이 변경 애니메이션 시간
 * @param color 막대 색
 * @param height 파형 높이
 */
const WaveBar = memo(({ index, heightRatios, duration, color, height }: Props) => {
	const heightStyle = useAnimatedStyle(() => ({
		height: withTiming(height * (MIN_HEIGHT_RATIO + (1 - MIN_HEIGHT_RATIO) * (heightRatios.get()[index] ?? 0)), {
			duration: duration.get(),
		}),
	}));

	return <Animated.View style={[styles.bar, { backgroundColor: color }, heightStyle]} />;
});

const styles = StyleSheet.create({
	bar: { flex: 1, minWidth: 1, borderRadius: 2 },
});

export default WaveBar;
