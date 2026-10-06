import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme';

const BODY_LINE_WIDTHS = ['100%', '100%', '100%', '92%', '60%'] as const;

/** 공지 내용을 불러오는 동안 보이는 컴포넌트 */
const AnnouncementContentSkeleton = () => {
	return (
		<View style={styles.container} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
			{/*제목과 날짜 자리*/}
			<View style={styles.headingContainer}>
				<View style={[styles.block, styles.titleBlock]} />
				<View style={[styles.block, styles.dateBlock]} />
			</View>

			{/*첨부 이미지 자리*/}
			<View style={[styles.block, styles.imageBlock]} />

			{/*본문 자리*/}
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
	dateBlock: { width: 48, height: 13 },
	body: { gap: 9 },
	lineBlock: { height: 15 },
	imageBlock: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.card },
});

export default AnnouncementContentSkeleton;
