import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme';

/** 학습 시간 영역을 불러오는 동안 보이는 컴포넌트 */
const TrendPaneSkeleton = () => {
	return (
		<View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
			<View style={styles.totalsRow}>
				<View style={styles.currentContainer}>
					<View style={[styles.block, styles.legendBlock]} />
					<View style={[styles.block, styles.totalBlock]} />
				</View>
				<View style={[styles.block, styles.previousBlock]} />
			</View>
			<View style={[styles.block, styles.changeBlock]} />
			<View style={[styles.block, styles.chartBlock]} />
			<View style={styles.axisSpace} />
		</View>
	);
};

const styles = StyleSheet.create({
	totalsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 4 },
	currentContainer: { flex: 1, minWidth: 0 },
	block: { borderRadius: radius.small, backgroundColor: colors.surface },
	legendBlock: { width: 56, height: 12 },
	totalBlock: { width: 150, height: 28, marginTop: 8 },
	previousBlock: { width: 70, height: 34 },
	changeBlock: { width: 130, height: 14, marginTop: 8 },
	chartBlock: { height: 160, marginTop: 14, borderRadius: radius.control },
	axisSpace: { height: 22 },
});

export default TrendPaneSkeleton;
