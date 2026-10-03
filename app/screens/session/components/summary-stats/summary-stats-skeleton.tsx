import { StyleSheet, View } from 'react-native';

import { colors, depths, radius } from '@/theme';

const STAT_COUNT = 4;

/** 학습 결과 숫자를 불러오는 동안 보이는 컴포넌트 */
const SummaryStatsSkeleton = () => {
	return (
		<View style={styles.container} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
			{Array.from({ length: STAT_COUNT }, (_, index) => (
				<View key={index} style={styles.chip}>
					<View style={[styles.block, styles.labelBlock]} />
					<View style={[styles.block, styles.valueBlock]} />
				</View>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
	chip: {
		flexGrow: 1,
		flexBasis: '40%',
		gap: 8,
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderWidth: 2,
		borderBottomWidth: 2 + depths.low,
		borderColor: colors.border,
		borderRadius: radius.control,
		borderCurve: 'continuous',
	},
	block: { borderRadius: radius.small, backgroundColor: colors.surface },
	labelBlock: { width: 64, height: 12 },
	valueBlock: { width: 56, height: 20 },
});

export default SummaryStatsSkeleton;
