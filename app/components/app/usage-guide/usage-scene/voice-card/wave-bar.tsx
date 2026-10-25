import { StyleSheet } from 'react-native';

import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { colors } from '@/theme';

const WAVE_MIN_LEVEL = 0.18;

interface Props {
	index: number;
	progress: SharedValue<number>;
	animated: boolean;
}

/**
 * 파형 막대 컴포넌트
 * @param index 막대 순서
 * @param progress 파형 애니메이션 진행도
 * @param animated 애니메이션 실행 여부
 */
const UsageSceneVoiceCardWaveBar = ({ index, progress, animated }: Props) => {
	const phase = ((index * 37) % 11) / 11;

	const barStyle = useAnimatedStyle(() => {
		if (!animated) {
			return {
				transform: [
					{
						scaleY: [
							0.35, 0.7, 0.45, 0.9, 0.55, 1, 0.6, 0.4, 0.8, 0.5, 0.95, 0.55, 0.85, 0.45, 0.7, 0.35, 0.6,
							0.3,
						][index],
					},
				],
			};
		}

		const wave = 0.5 - 0.5 * Math.cos(2 * Math.PI * (progress.get() + phase));

		return { transform: [{ scaleY: WAVE_MIN_LEVEL + (1 - WAVE_MIN_LEVEL) * wave }] };
	});

	return <Animated.View style={[styles.waveBar, barStyle]} />;
};

const styles = StyleSheet.create({
	waveBar: { width: 4, height: 30, borderRadius: 2, backgroundColor: colors.onFilled },
});

export default UsageSceneVoiceCardWaveBar;
