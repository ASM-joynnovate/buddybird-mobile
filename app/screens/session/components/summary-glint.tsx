import { StyleSheet } from 'react-native';

import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { colors } from '@/theme';

const GLINT_WIDTH_RATIO = 0.2;
const GLINT_START_RATIO = -0.3;
const GLINT_END_RATIO = 1.2;

interface Props {
	progress: SharedValue<number>;
	width: number;
}

/**
 * 감싸는 칸 위를 비스듬히 지나가는 흰 빛줄기 컴포넌트
 * @param progress 0이면 왼쪽 밖, 1이면 오른쪽 밖에 있는 진행률
 * @param width 빛줄기가 지나갈 칸의 폭
 */
const SummaryGlint = ({ progress, width }: Props) => {
	const glintStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateX: width * (GLINT_START_RATIO + (GLINT_END_RATIO - GLINT_START_RATIO) * progress.get()) },
			{ skewX: '-20deg' },
		],
	}));

	return (
		<Animated.View pointerEvents="none" style={[styles.glint, { width: width * GLINT_WIDTH_RATIO }, glintStyle]} />
	);
};

const styles = StyleSheet.create({
	glint: { position: 'absolute', top: -4, bottom: -4, left: 0, backgroundColor: colors.onFilled, opacity: 0.6 },
});

export default SummaryGlint;
