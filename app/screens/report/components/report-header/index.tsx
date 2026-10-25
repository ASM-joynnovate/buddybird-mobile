import { StyleSheet, View } from 'react-native';

import { useGetReport } from '@/hooks/apis/reports';

import { useTranslation } from 'react-i18next';

import ReportHeaderPeriodMenu from '@/screens/report/components/report-header/period-menu';
import ReportHeaderPeriodNav from '@/screens/report/components/report-header/period-nav';
import ReportHeaderTodayButton from '@/screens/report/components/report-header/today-button';
import ReportHeaderTrendPager from '@/screens/report/components/report-header/trend-pager';
import ReportHeaderWordBars from '@/screens/report/components/report-header/word-bars';
import { useReportStore } from '@/stores/report';
import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { ScreenHeader } from '@/components/ui/screen-header';

interface Props {
	start: string;
}

/**
 * 기간별 학습 시간 요약 컴포넌트
 * @param start 표시할 기간의 시작 날짜
 */
const ReportHeader = ({ start }: Props) => {
	const { t } = useTranslation();

	const period = useReportStore((state) => state.period);

	const { data: reportData } = useGetReport({ period, start });

	const hasSessions = reportData.sessions.length > 0;

	return (
		<View>
			<ScreenHeader
				title={t('report.title')}
				large
				trailing={
					<>
						<ReportHeaderTodayButton />
						<ReportHeaderPeriodMenu />
					</>
				}
			/>
			<View style={styles.divider} />

			<ReportHeaderPeriodNav />
			<ReportHeaderTrendPager key={period} />

			{hasSessions && (
				<>
					<View style={styles.band} />
					<ReportHeaderWordBars key={start} start={start} />

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
