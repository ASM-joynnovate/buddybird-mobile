import { StyleSheet } from 'react-native';

import Animated, { Extrapolation, interpolate, type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme';

export const SOUND_WAVE_WIDTH = 64;

export const SOUND_WAVE_HEIGHT = 60;

interface Props {
	index: number;
	scale: number;
	animated: boolean;
	cycleProgress: SharedValue<number>;
}

/**
 * 마이크 쪽으로 퍼지는 소리 물결 컴포넌트
 * @param index 입에서부터의 물결 순서
 * @param scale 그림 배율
 * @param animated 애니메이션 실행 여부
 * @param cycleProgress 녹음 주기 진행률
 */
const RecordingSceneDistanceSoundWave = ({ index, scale, animated, cycleProgress }: Props) => {
	const waveStyle = useAnimatedStyle(() => {
		if (!animated) {
			return { opacity: 1 };
		}

		const start = index * 0.05;
		const range = [start, start + 0.06, start + 0.2];

		return {
			opacity: interpolate(cycleProgress.get(), range, [0, 1, 0], Extrapolation.CLAMP),
			transform: [
				{ translateX: interpolate(cycleProgress.get(), range, [-8, 0, 14], Extrapolation.CLAMP) * scale },
			],
		};
	});

	const x = 6 + index * 14;

	return (
		<Animated.View style={[StyleSheet.absoluteFill, waveStyle]}>
			<Svg
				width={SOUND_WAVE_WIDTH * scale}
				height={SOUND_WAVE_HEIGHT * scale}
				viewBox={`0 0 ${SOUND_WAVE_WIDTH} ${SOUND_WAVE_HEIGHT}`}
			>
				<Path
					d={`M${x} ${18 - index * 7}Q${18 + index * 17} 30 ${x} ${42 + index * 7}`}
					fill="none"
					stroke={colors.background}
					strokeWidth={5}
					strokeLinecap="round"
				/>
			</Svg>
		</Animated.View>
	);
};

export default RecordingSceneDistanceSoundWave;
