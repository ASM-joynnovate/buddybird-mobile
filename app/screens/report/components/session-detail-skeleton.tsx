import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme';

const PLACEHOLDER_ROW_COUNT = 4;

/** 세션 상세를 불러오는 동안 보이는 컴포넌트 */
const SessionDetailSkeleton = () => {
	return (
		<View style={styles.container} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
			<View style={[styles.block, styles.overviewBlock]} />

			{Array.from({ length: PLACEHOLDER_ROW_COUNT }, (_, index) => (
				<View key={index} style={[styles.block, styles.rowBlock]} />
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, overflow: 'hidden', gap: 8, paddingTop: 8 },
	block: { borderRadius: radius.small, backgroundColor: colors.surface },
	overviewBlock: { height: 152, marginBottom: 24, borderRadius: 16 },
	rowBlock: { height: 64, borderRadius: 16 },
});

export default SessionDetailSkeleton;
