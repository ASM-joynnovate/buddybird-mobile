import { StyleSheet, View } from 'react-native';

import { colors, depths, radius } from '@/theme';

const PLACEHOLDER_ROW_COUNT = 8;

/** 따라 한 소리 목록을 불러오는 동안 보이는 컴포넌트 */
const MimicrySoundListSkeleton = () => {
	return (
		<View style={styles.container} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
			{Array.from({ length: PLACEHOLDER_ROW_COUNT }, (_, index) => (
				<View key={index} style={styles.row}>
					<View style={styles.textContainer}>
						<View style={[styles.block, styles.timeBlock]} />
						<View style={[styles.block, styles.tagBlock]} />
					</View>
					<View style={[styles.block, styles.playBlock]} />
				</View>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, overflow: 'hidden' },
	row: {
		minHeight: 64,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingVertical: 8,
		paddingHorizontal: 4,
	},
	textContainer: { flex: 1, minWidth: 0, gap: 8 },
	block: { borderRadius: radius.small, backgroundColor: colors.surface },
	timeBlock: { width: 64, height: 14 },
	tagBlock: { width: 56, height: 24, borderRadius: radius.pill },
	playBlock: { width: 44, height: 44, marginBottom: depths.medium, borderRadius: radius.pill },
});

export default MimicrySoundListSkeleton;
