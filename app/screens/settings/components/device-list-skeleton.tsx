import { StyleSheet, View } from 'react-native';

import { colors, depths, radius } from '@/theme';

const PLACEHOLDER_CARD_COUNT = 2;

/** 연결된 기기 목록을 불러오는 동안 보이는 컴포넌트 */
const DeviceListSkeleton = () => {
	return (
		<View style={styles.container} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
			{Array.from({ length: PLACEHOLDER_CARD_COUNT }, (_, index) => (
				<View key={index} style={styles.card}>
					<View style={[styles.block, styles.nameBlock]} />
					<View style={[styles.block, styles.detailBlock]} />
					{index === 0 && <View style={[styles.block, styles.tagBlock]} />}
				</View>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, overflow: 'hidden', gap: 12 },
	card: {
		gap: 6,
		padding: 16,
		borderWidth: 2,
		borderBottomWidth: 2 + depths.low,
		borderColor: colors.border,
		borderRadius: radius.card,
		borderCurve: 'continuous',
	},
	block: { borderRadius: radius.small, backgroundColor: colors.surface },
	nameBlock: { width: 140, height: 18, marginVertical: 3 },
	detailBlock: { width: 120, height: 13 },
	tagBlock: { width: 56, height: 24, marginTop: 6, borderRadius: radius.pill },
});

export default DeviceListSkeleton;
