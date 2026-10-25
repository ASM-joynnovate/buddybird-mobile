import { StyleSheet } from 'react-native';

import Animated, { Extrapolation, interpolate, type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { colors, radius } from '@/theme';

interface Props {
	index: number;
	level: number;
	scale: number;
	animated: boolean;
	cycleProgress: SharedValue<number>;
}

/**
 * 휴대폰 화면에 녹음된 소리를 그리는 파형 막대 컴포넌트
 * @param index 왼쪽부터의 막대 순서
 * @param level 막대 높이 비율
 * @param scale 그림 배율
 * @param animated 애니메이션 실행 여부
 * @param cycleProgress 녹음 주기 진행률
 */
const RecordingSceneDistanceWaveformBar = ({ index, level, scale, animated, cycleProgress }: Props) => {
	const barStyle = useAnimatedStyle(() => {
		if (!animated) {
			return { opacity: 1, transform: [{ scaleY: 1 }] };
		}

		const start = 0.28 + index * 0.042;
		const recordedProgress = interpolate(
			cycleProgress.get(),
			[start, start + 0.05, 0.88, 0.96],
			[0, 1, 1, 0],
			Extrapolation.CLAMP,
		);

		return { opacity: 0.35 + recordedProgress * 0.65, transform: [{ scaleY: 0.12 + recordedProgress * 0.88 }] };
	});

	return <Animated.View style={[styles.waveformBar, { width: 3 * scale, height: level * 40 * scale }, barStyle]} />;
};

const styles = StyleSheet.create({
	waveformBar: { borderRadius: radius.pill, backgroundColor: colors.orange },
});

export default RecordingSceneDistanceWaveformBar;
