import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import PeriodMenu from '@/screens/report/components/report-header/period-menu';
import PeriodNav from '@/screens/report/components/report-header/period-nav';
import TrendPaneSkeleton from '@/screens/report/components/report-header/trend-pane-skeleton';
import { colors, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { ScreenHeader } from '@/components/ui/screen-header';

const PLACEHOLDER_ROW_COUNT = 3;

/** 리포트를 불러오는 동안 보이는 컴포넌트 */
const ReportSkeleton = () => {
	const { t } = useTranslation();

	return (
		<View style={styles.container}>
			<ScreenHeader title={t('report.title')} large trailing=<PeriodMenu /> />
			<View style={styles.divider} />

			<PeriodNav />
			<TrendPaneSkeleton />

			{/*단어별 학습 시간과 학습 목록 자리*/}
			<View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
				<View style={styles.band} />
				<Copy style={styles.sectionTitle}>{t('report.learningTimeByWord')}</Copy>
				{Array.from({ length: PLACEHOLDER_ROW_COUNT }, (_, index) => (
					<View key={index} style={[styles.wordRow, index > 0 && styles.dividedRow]}>
						<View style={[styles.block, styles.wordNameBlock]} />
						<View style={styles.track} />
						<View style={[styles.block, styles.wordDurationBlock]} />
					</View>
				))}

				<View style={styles.band} />
				<Copy style={styles.sectionTitle}>{t('report.sessions')}</Copy>
				<View style={styles.sessionsContainer}>
					{Array.from({ length: PLACEHOLDER_ROW_COUNT }, (_, index) => (
						<View key={index} style={styles.sessionCard}>
							<View style={styles.sessionText}>
								<View style={[styles.block, styles.sessionWordBlock]} />
								<View style={[styles.block, styles.sessionTimeBlock]} />
							</View>
							<View style={[styles.block, styles.sessionDurationBlock]} />
						</View>
					))}
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { paddingTop: 12 },
	divider: { height: 2, marginHorizontal: -24, marginBottom: 8, backgroundColor: colors.border },
	band: {
		height: 10,
		marginHorizontal: -24,
		marginVertical: 22,
		borderTopWidth: 2,
		borderTopColor: colors.border,
		backgroundColor: colors.surface,
	},
	sectionTitle: { marginBottom: 12, fontFamily: font.black, fontSize: 16, lineHeight: 22 },
	block: { borderRadius: radius.small, backgroundColor: colors.surface },
	wordRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13 },
	dividedRow: { borderTopWidth: 2, borderTopColor: colors.border },
	wordNameBlock: { width: 40, height: 14 },
	track: { flex: 1, height: 19, borderRadius: 8, backgroundColor: colors.surface },
	wordDurationBlock: { width: 56, height: 14 },
	sessionsContainer: { gap: 10 },
	sessionCard: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderWidth: 2,
		borderColor: colors.border,
		borderRadius: radius.card,
	},
	sessionText: { flex: 1, gap: 6 },
	sessionWordBlock: { width: 64, height: 14 },
	sessionTimeBlock: { width: 120, height: 11 },
	sessionDurationBlock: { width: 44, height: 13 },
});

export default ReportSkeleton;
