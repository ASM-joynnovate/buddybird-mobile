import { StyleSheet, View } from 'react-native';

import type { Report } from '@/types/apis/reports';

import { useTranslation } from 'react-i18next';

import PeriodMenu from '@/screens/report/components/report-header/period-menu';
import PeriodNav from '@/screens/report/components/report-header/period-nav';
import TrendPager from '@/screens/report/components/report-header/trend-pager';
import WordBars from '@/screens/report/components/report-header/word-bars';
import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { ScreenHeader } from '@/components/ui/screen-header';

interface Props {
	report: Report;
	previousReport: Report;
}

/**
 * 기간별 학습 시간 요약 컴포넌트
 * @param report 선택한 기간의 리포트
 * @param previousReport 선택한 기간 바로 전 기간의 리포트
 */
const ReportHeader = ({ report, previousReport }: Props) => {
	const { t } = useTranslation();

	const hasSessions = report.sessions.length > 0;

	return (
		<View>
			<ScreenHeader title={t('report.title')} large trailing=<PeriodMenu /> />
			<View style={styles.divider} />

			<PeriodNav />
			<TrendPager key={report.period.unit} />

			{hasSessions && (
				<>
					<View style={styles.band} />
					<WordBars
						key={report.period.start}
						period={report.period.unit}
						words={report.learning.words}
						previousWords={previousReport.learning.words}
					/>

					<View style={styles.band} />
					<Copy accessibilityRole="header" style={styles.sessionsTitle}>
						{t('report.sessions')}
					</Copy>
				</>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	divider: { height: 2, marginHorizontal: -24, marginBottom: 8, backgroundColor: colors.border },
	band: {
		height: 10,
		marginHorizontal: -24,
		marginVertical: 22,
		borderTopWidth: 2,
		borderTopColor: colors.border,
		backgroundColor: colors.surface,
	},
	sessionsTitle: { fontFamily: font.black, fontSize: 16, lineHeight: 22, marginBottom: 2 },
});

export default ReportHeader;
