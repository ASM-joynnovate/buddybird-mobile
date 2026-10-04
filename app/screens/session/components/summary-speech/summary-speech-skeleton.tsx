import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { colors, depths, radius } from '@/theme';

const PAGE_COUNT = 4;

interface Props {
	mascotSize: number;
}

/**
 * 버디의 학습 결과 문장을 불러오는 동안 보이는 컴포넌트
 * @param mascotSize 마스코트 크기
 */
const SummarySpeechSkeleton = ({ mascotSize }: Props) => {
	const { width, height } = useWindowDimensions();

	const isLandscape = width > height;

	return (
		<View style={styles.container} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
			{/*말풍선 자리*/}
			<View style={styles.bubble}>
				<View style={[styles.sentence, isLandscape && styles.sentenceLandscape]}>
					<View style={[styles.block, styles.leadBlock]} />
					<View style={[styles.block, styles.numberBlock, isLandscape && styles.numberBlockLandscape]} />
					<View style={[styles.block, styles.tailBlock]} />
				</View>
				<View style={styles.pageDots}>
					{Array.from({ length: PAGE_COUNT }, (_, index) => (
						<View key={index} style={[styles.dot, index === 0 && styles.currentDot]} />
					))}
				</View>
			</View>

			{/*버디 자리*/}
			<View style={[styles.block, { width: mascotSize, height: mascotSize, borderRadius: radius.pill }]} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: { alignItems: 'center', gap: 16 },
	bubble: {
		alignSelf: 'stretch',
		gap: 8,
		paddingVertical: 16,
		paddingHorizontal: 20,
		borderWidth: 2,
		borderBottomWidth: 2 + depths.low,
		borderColor: colors.border,
		borderRadius: radius.control,
		borderCurve: 'continuous',
	},
	sentence: { minHeight: 104, alignItems: 'center', justifyContent: 'center', gap: 4 },
	sentenceLandscape: { minHeight: 88 },
	block: { borderRadius: radius.small, backgroundColor: colors.surface },
	leadBlock: { width: 140, height: 18 },
	numberBlock: { width: 72, height: 48, borderRadius: 12 },
	numberBlockLandscape: { height: 40, borderRadius: radius.small },
	tailBlock: { width: 110, height: 18 },
	pageDots: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
	dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.border },
	currentDot: { width: 20 },
});

export default SummarySpeechSkeleton;
