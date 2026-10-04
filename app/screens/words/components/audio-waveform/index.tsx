import { useEffect } from 'react';

import { StyleSheet, View } from 'react-native';

import { useReducedMotion, useSharedValue } from 'react-native-reanimated';

import WaveBar from '@/screens/words/components/audio-waveform/wave-bar';

const TRANSITION_MS = 80;

interface Props {
	levels: readonly number[];
	color: string;
	height: number;
	activeColor?: string;
	activeCount?: number;
}

/**
 * 소리 파형 컴포넌트
 * @param levels 막대마다 0에서 1 사이의 소리 크기
 * @param color 막대 색
 * @param height 파형 높이
 * @param activeColor 앞쪽 막대에 칠할 색
 * @param activeCount activeColor로 칠할 앞쪽 막대 수
 */
const AudioWaveform = ({ levels, color, height, activeColor = color, activeCount = 0 }: Props) => {
	const reducedMotion = useReducedMotion();

	const heightRatios = useSharedValue<number[]>([...levels]);
	const duration = useSharedValue(TRANSITION_MS);

	/** 소리 크기가 바뀌면 막대 높이 변경 */
	useEffect(() => {
		duration.set(reducedMotion ? 0 : TRANSITION_MS);
		heightRatios.set([...levels]);
	}, [duration, heightRatios, levels, reducedMotion]);

	return (
		<View
			style={[styles.container, { height }]}
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
		>
			{levels.map((_, index) => (
				<WaveBar
					key={index}
					index={index}
					heightRatios={heightRatios}
					duration={duration}
					color={index < activeCount ? activeColor : color}
					height={height}
				/>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 3 },
});

export default AudioWaveform;
