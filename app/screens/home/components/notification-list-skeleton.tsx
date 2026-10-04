import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme';

const PLACEHOLDER_ROW_COUNT = 8;

/** 알림 목록을 불러오는 동안 보이는 컴포넌트 */
const NotificationListSkeleton = () => {
	return (
		<View style={styles.container} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
			{Array.from({ length: PLACEHOLDER_ROW_COUNT }, (_, index) => (
				<View key={index} style={styles.row}>
					<View style={[styles.block, styles.iconBlock]} />
					<View style={styles.textContainer}>
						<View style={[styles.block, styles.titleBlock]} />
						<View style={[styles.block, styles.bodyBlock]} />
						<View style={[styles.block, styles.timeBlock]} />
					</View>
				</View>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, overflow: 'hidden' },
	row: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 12,
		paddingVertical: 14,
		paddingHorizontal: 4,
		borderBottomWidth: 2,
		borderBottomColor: colors.border,
	},
	block: { borderRadius: radius.small, backgroundColor: colors.surface },
	iconBlock: { width: 36, height: 36, borderRadius: radius.control },
	textContainer: { flex: 1, minWidth: 0, gap: 6 },
	titleBlock: { width: '45%', height: 16 },
	bodyBlock: { width: '85%', height: 14 },
	timeBlock: { width: 40, height: 12 },
});

export default NotificationListSkeleton;
