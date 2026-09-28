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
	fill: boolean;
}

/**
 * 높이 비율이 바뀌면 정한 시간 동안 높이가 바뀌는 파형 막대 하나를 보여 주는 컴포넌트
 * @param index 파형 안의 막대 순서
 * @param heightRatios 막대마다의 높이 비율
 * @param duration 높이가 바뀌는 데 걸리는 시간
 * @param color 막대 색
 * @param height 파형 높이
 * @param fill 막대들이 가로 폭을 나눠 채우는지 여부
 */
const WaveBar = memo(({ index, heightRatios, duration, color, height, fill }: Props) => {
	const heightStyle = useAnimatedStyle(() => ({
		height: withTiming(height * (MIN_HEIGHT_RATIO + (1 - MIN_HEIGHT_RATIO) * heightRatios.get()[index]), {
			duration: duration.get(),
		}),
	}));

	return (
		<Animated.View
			style={[styles.bar, fill ? styles.fillBar : styles.fixedBar, { backgroundColor: color }, heightStyle]}
		/>
	);
});

const styles = StyleSheet.create({
	bar: { borderRadius: 2 },
	fixedBar: { width: 4 },
	fillBar: { flex: 1, minWidth: 1 },
});

export default WaveBar;
