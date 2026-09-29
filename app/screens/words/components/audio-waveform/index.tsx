import { useEffect } from 'react';

import { StyleSheet, View } from 'react-native';

import { useReducedMotion, useSharedValue } from 'react-native-reanimated';

import WaveBar from '@/screens/words/components/audio-waveform/wave-bar';

const LIVE_TRANSITION_MS = 80;
const LOOP_INTERVAL_MS = 200;

/** 가운데 막대일수록 1에 가깝고 양 끝 막대일수록 0에 가까운 높이 가중치 */
const centerWeight = (index: number, barCount: number) => {
	return 1 - Math.abs(index - barCount / 2) / (barCount / 2);
};

/** 녹음 중인 소리 크기에 맞춰 조금씩 흔들리는 막대 높이 비율 */
const liveHeightRatios = (level: number, barCount: number) => {
	return Array.from({ length: barCount }, (_, index) => {
		const jitter = (Math.random() - 0.5) * 0.35 * level;

		return Math.max(0, Math.min(1, level * centerWeight(index, barCount) + jitter));
	});
};

/** 재생 중에 되풀이해 바꾸는 임의의 막대 높이 비율 */
const loopHeightRatios = (barCount: number) => {
	return Array.from({ length: barCount }, (_, index) =>
		Math.max(0.08, centerWeight(index, barCount) * 0.55 + (Math.random() - 0.5) * 0.3),
	);
};

interface Props {
	color: string;
	height: number;
	barCount: number;
	fullWidth?: boolean;
	level?: number | null;
	looping?: boolean;
}

/**
 * 녹음 중에는 소리 크기에 맞춰, 재생 중에는 일정 간격으로 높이가 바뀌는 막대들을 보여 주는 컴포넌트
 * @param color 막대 색
 * @param height 파형 높이
 * @param barCount 막대 개수
 * @param fullWidth 막대들이 가로 폭을 다 채우는지 여부
 * @param level 0에서 1 사이의 녹음 중인 소리 크기, 녹음 중이 아니면 null
 * @param looping 막대 높이를 일정 간격으로 되풀이해 바꾸는지 여부
 */
const AudioWaveform = ({ color, height, barCount, fullWidth = false, level, looping = false }: Props) => {
	const reducedMotion = useReducedMotion();

	const heightRatios = useSharedValue<number[]>(Array.from({ length: barCount }, () => 0));
	const duration = useSharedValue(LOOP_INTERVAL_MS);

	/** 소리 크기나 되풀이 여부가 바뀔 때 막대 높이 변경, 되풀이 중에는 일정 간격으로 변경 */
	useEffect(() => {
		if (typeof level === 'number') {
			duration.set(reducedMotion ? 0 : LIVE_TRANSITION_MS);
			heightRatios.set(liveHeightRatios(level, barCount));

			return undefined;
		}

		if (looping && !reducedMotion) {
			/** 되풀이 중인 막대 높이 변경 */
			const updateLoopHeights = () => {
				duration.set(LOOP_INTERVAL_MS);
				heightRatios.set(loopHeightRatios(barCount));
			};

			updateLoopHeights();

			const timer = setInterval(updateLoopHeights, LOOP_INTERVAL_MS);

			return () => clearInterval(timer);
		}

		duration.set(reducedMotion ? 0 : LOOP_INTERVAL_MS);
		heightRatios.set(Array(barCount).fill(0));

		return undefined;
	}, [looping, barCount, duration, level, reducedMotion, heightRatios]);

	return (
		<View
			style={[styles.container, fullWidth && styles.fullWidth, { height }]}
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
		>
			{Array.from({ length: barCount }, (_, index) => (
				<WaveBar
					key={index}
					index={index}
					heightRatios={heightRatios}
					duration={duration}
					color={color}
					height={height}
					fill={fullWidth}
				/>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 3,
	},
	fullWidth: { width: '100%' },
});

export default AudioWaveform;
