import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme';

const BODY_LINE_WIDTHS = ['100%', '100%', '100%', '92%', '60%'] as const;

/** 알림 및 공지 내용을 불러오는 동안 표시하는 컴포넌트 */
const DetailContentSkeleton = () => {
	return (
		<View style={styles.container} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
			<View style={styles.headingContainer}>
				<View style={[styles.block, styles.titleBlock]} />
				<View style={[styles.block, styles.timeBlock]} />
			</View>

			<View style={[styles.block, styles.imageBlock]} />

			<View style={styles.body}>
				{BODY_LINE_WIDTHS.map((width, index) => (
					<View key={index} style={[styles.block, styles.lineBlock, { width }]} />
				))}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, overflow: 'hidden', gap: 20 },
	headingContainer: { gap: 6 },
	block: { borderRadius: radius.small, backgroundColor: colors.surface },
	titleBlock: { width: '80%', height: 26, marginVertical: 3 },
	timeBlock: { width: 48, height: 13 },
	body: { gap: 9 },
	lineBlock: { height: 15 },
	imageBlock: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.card },
});

export default DetailContentSkeleton;
