import { useEffect } from 'react';

import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import Animated, {
	cancelAnimation,
	Easing,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';

import { SECOND } from '@/config/units';
import { colors, radius } from '@/theme';

const WAVES_SIZE = 60;
const WAVE_MS = 1.8 * SECOND;
const WAVE_STILL_PROGRESS = 0.3;

/** 퍼져 나가는 소리 파동 하나의 스타일을 반환하는 함수 */
const getWaveStyle = (progress: number) => {
	'worklet';

	const phase = progress % 1;

	return {
		opacity: interpolate(phase, [0, 0.2, 1], [0, 1, 0]),
		transform: [{ scale: interpolate(phase, [0, 1], [0.4, 1.4]) }],
	};
};

interface Props {
	scale: number;
	animated: boolean;
	style?: StyleProp<ViewStyle>;
}

/**
 * 앵무새 소리가 휴대폰으로 퍼져 나가는 파동 컴포넌트
 * @param scale 그림 배율
 * @param animated 파동 움직임 실행 여부
 * @param style 파동 위치
 */
const PermissionSceneWaves = ({ scale, animated, style }: Props) => {
	const waveProgress = useSharedValue(WAVE_STILL_PROGRESS);

	const firstWaveStyle = useAnimatedStyle(() => getWaveStyle(waveProgress.get()));
	const secondWaveStyle = useAnimatedStyle(() => getWaveStyle(waveProgress.get() + 1 / 3));
	const thirdWaveStyle = useAnimatedStyle(() => getWaveStyle(waveProgress.get() + 2 / 3));

	/** 움직임이 켜져 있으면 파동 반복 */
	useEffect(() => {
		if (!animated) {
			return;
		}

		waveProgress.set(0);
		waveProgress.set(withRepeat(withTiming(1, { duration: WAVE_MS, easing: Easing.linear }), -1));

		return () => cancelAnimation(waveProgress);
	}, [animated, waveProgress]);

	return (
		<View style={[styles.container, { width: WAVES_SIZE * scale, height: WAVES_SIZE * scale }, style]}>
			<Animated.View style={[styles.wave, firstWaveStyle]} />
			<Animated.View style={[styles.wave, secondWaveStyle]} />
			<Animated.View style={[styles.wave, thirdWaveStyle]} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: { position: 'absolute' },
	wave: {
		...StyleSheet.absoluteFill,
		borderRadius: radius.pill,
		borderWidth: 3,
		borderColor: colors.backgroundTransparent,
		borderRightColor: colors.orange,
	},
});

export default PermissionSceneWaves;
