import { useEffect } from 'react';

import { StyleSheet, View } from 'react-native';

import { useReducedMotion, useSharedValue } from 'react-native-reanimated';

import { WaveBar } from '@/screens/words/components/audio-waveform/wave-bar';

const LIVE_TRANSITION_MS = 80;
const LOOP_INTERVAL_MS = 200;

function centerWeight(index: number, barCount: number): number {
	return 1 - Math.abs(index - barCount / 2) / (barCount / 2);
}

function liveHeightRatios(level: number, barCount: number): number[] {
	return Array.from({ length: barCount }, (_, index) => {
		const jitter = (Math.random() - 0.5) * 0.35 * level;

		return Math.max(0, Math.min(1, level * centerWeight(index, barCount) + jitter));
	});
}

function loopHeightRatios(barCount: number): number[] {
	return Array.from({ length: barCount }, (_, index) =>
		Math.max(0.08, centerWeight(index, barCount) * 0.55 + (Math.random() - 0.5) * 0.3),
	);
}

interface Props {
	color: string;
	height: number;
	barCount: number;
	fullWidth?: boolean;
	level?: number | null;
	looping?: boolean;
}

export function AudioWaveform({ color, height, barCount, fullWidth = false, level, looping = false }: Props) {
	const reduced = useReducedMotion();

	const heightRatios = useSharedValue<number[]>(Array.from({ length: barCount }, () => 0));
	const duration = useSharedValue(LOOP_INTERVAL_MS);

	useEffect(() => {
		if (typeof level === 'number') {
			duration.set(reduced ? 0 : LIVE_TRANSITION_MS);
			heightRatios.set(liveHeightRatios(level, barCount));

			return undefined;
		}

		if (looping && !reduced) {
			const updateLoopHeights = () => {
				duration.set(LOOP_INTERVAL_MS);
				heightRatios.set(loopHeightRatios(barCount));
			};

			updateLoopHeights();

			const timer = setInterval(updateLoopHeights, LOOP_INTERVAL_MS);

			return () => clearInterval(timer);
		}

		duration.set(reduced ? 0 : LOOP_INTERVAL_MS);
		heightRatios.set(Array(barCount).fill(0));

		return undefined;
	}, [looping, barCount, duration, level, reduced, heightRatios]);

	return (
		<View
			style={[styles.waveform, fullWidth && styles.fullWidth, { height }]}
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
}

const styles = StyleSheet.create({
	waveform: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 3,
	},
	fullWidth: { width: '100%' },
});
