import { StyleSheet, View } from 'react-native';

import { colors, depths, radius } from '@/theme';

const PLACEHOLDER_CARD_COUNT = 8;

/** 공지 목록을 불러오는 동안 보이는 컴포넌트 */
const AnnouncementListSkeleton = () => {
	return (
		<View style={styles.container} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
			{Array.from({ length: PLACEHOLDER_CARD_COUNT }, (_, index) => (
				<View key={index} style={styles.card}>
					<View style={[styles.block, styles.titleBlock]} />
					<View style={[styles.block, styles.dateBlock]} />
				</View>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, overflow: 'hidden', gap: 12 },
	card: {
		gap: 8,
		padding: 16,
		borderWidth: 2,
		borderBottomWidth: 2 + depths.low,
		borderColor: colors.border,
		borderRadius: radius.card,
		borderCurve: 'continuous',
	},
	block: { borderRadius: radius.small, backgroundColor: colors.surface },
	titleBlock: { width: '70%', height: 16 },
	dateBlock: { width: 48, height: 13 },
});

export default AnnouncementListSkeleton;
