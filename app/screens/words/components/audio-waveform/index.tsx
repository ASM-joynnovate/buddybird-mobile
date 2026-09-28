import { useEffect } from 'react';

import { StyleSheet, View } from 'react-native';

import { useReducedMotion, useSharedValue } from 'react-native-reanimated';

import { WaveBar } from '@/screens/words/components/audio-waveform/wave-bar';

const LIVE_MS = 80;
const LOOP_MS = 200;

function centreWeight(index: number, barCount: number): number {
	return 1 - Math.abs(index - barCount / 2) / (barCount / 2);
}

function liveTargets(effective: number, barCount: number): number[] {
	return Array.from({ length: barCount }, (_, index) => {
		const jitter = (Math.random() - 0.5) * 0.35 * effective;

		return Math.max(0, Math.min(1, effective * centreWeight(index, barCount) + jitter));
	});
}

function loopTargets(barCount: number): number[] {
	return Array.from({ length: barCount }, (_, index) =>
		Math.max(0.08, centreWeight(index, barCount) * 0.55 + (Math.random() - 0.5) * 0.3),
	);
}

interface Props {
	color: string;
	height: number;
	barCount: number;
	fill?: boolean;
	level?: number | null;
	animated?: boolean;
}

export function AudioWaveform({ color, height, barCount, fill = false, level, animated = false }: Props) {
	const reduced = useReducedMotion();

	const targets = useSharedValue<number[]>(Array.from({ length: barCount }, () => 0));
	const duration = useSharedValue(LOOP_MS);

	useEffect(() => {
		if (typeof level === 'number') {
			duration.set(reduced ? 0 : LIVE_MS);
			targets.set(liveTargets(level, barCount));

			return undefined;
		}

		if (animated && !reduced) {
			const tick = () => {
				duration.set(LOOP_MS);
				targets.set(loopTargets(barCount));
			};

			tick();

			const timer = setInterval(tick, LOOP_MS);

			return () => clearInterval(timer);
		}

		duration.set(reduced ? 0 : LOOP_MS);
		targets.set(Array(barCount).fill(0));

		return undefined;
	}, [animated, barCount, duration, level, reduced, targets]);

	return (
		<View
			style={[styles.waveform, fill && styles.fill, { height }]}
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
		>
			{Array.from({ length: barCount }, (_, index) => (
				<WaveBar
					key={index}
					index={index}
					targets={targets}
					duration={duration}
					color={color}
					height={height}
					fill={fill}
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
	fill: { width: '100%' },
});
