import { StyleSheet, View } from 'react-native';

import LevelBar from '@/screens/report/components/level-bar';
import { colors } from '@/theme';

const WAVE_HEIGHT = 34;
const WAVE_SEED = 0.6;
const BAR_COUNT = 16;
const MIN_BAR_HEIGHT = 3;
const BAR_MS = 520;
const BAR_STAGGER_MS = 110;
const BAR_STAGGER_STEPS = 5;
const BAR_HEIGHTS = Array.from({ length: BAR_COUNT }, (_, index) => {
	const level = 20 + Math.abs(Math.sin(index * 0.6 + WAVE_SEED) * 55 + Math.sin(index * 1.8 + WAVE_SEED * 2) * 25);

	return Math.max((Math.min(level, 100) / 100) * WAVE_HEIGHT, MIN_BAR_HEIGHT);
});

interface Props {
	active: boolean;
	playing: boolean;
}

/**
 * 녹음기 표시창의 파형 컴포넌트
 * @param active 선택한 소리가 있는지 여부
 * @param playing 재생 중 여부
 */
const RecorderWaveform = ({ active, playing }: Props) => {
	const color = active ? colors.orange : colors.orangeSoft;

	return (
		<View style={styles.wave} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
			{BAR_HEIGHTS.map((height, index) => (
				<LevelBar
					key={index}
					playing={playing}
					duration={BAR_MS}
					delay={(index % BAR_STAGGER_STEPS) * BAR_STAGGER_MS}
					style={[styles.bar, { height, backgroundColor: color }]}
				/>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	wave: { flexDirection: 'row', alignItems: 'center', gap: 2, height: WAVE_HEIGHT },
	bar: { width: 3, borderRadius: 2 },
});

export default RecorderWaveform;
