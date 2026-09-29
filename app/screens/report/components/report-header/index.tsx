import { StyleSheet, View } from 'react-native';

import type { Report } from '@/types/apis/reports';

import type { RootStackParamList } from '@/types/navigation';
import { reportPeriodSchema } from '@/types/report-period';

import { useTranslation } from 'react-i18next';

import { formatDuration, formatMonthDay, formatMonthDayWeekday, formatYearMonth } from '@/i18n/format';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChartNoAxesColumnIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react-native';

import TrendChart from '@/screens/report/components/report-header/trend-chart';
import WordBars from '@/screens/report/components/report-header/word-bars';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { useReportStore } from '@/stores/report';
import { colors, font } from '@/theme';
import { latestStart } from '@/utils/report-period';

import Illustration from '@/components/illustration';
import { Chip } from '@/components/ui/chip';
import { Copy } from '@/components/ui/copy';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ui } from '@/components/ui/styles';
import { Card } from '@/components/ui/surface/card';

interface Props {
	report: Report;
}

/**
 * 리포트 기간 선택, 기간의 학습 시간과 막대 그래프, 단어별 학습 시간을 보여 주고 이전과 다음 버튼을 누르면 기간을 옮기는 컴포넌트
 * @param report 고른 기간의 리포트
 */
const ReportHeader = ({ report }: Props) => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const period = useReportStore((state) => state.period);
	const start = useReportStore((state) => state.start);
	const selectPeriod = useReportStore((state) => state.selectPeriod);
	const movePeriod = useReportStore((state) => state.movePeriod);

	const hasSessions = report.sessions.length > 0;
	const periodLabel =
		report.period === 'day'
			? formatMonthDayWeekday(report.start, locale)
			: report.period === 'month'
				? formatYearMonth(report.start, locale)
				: `${formatMonthDay(report.start, locale)} ~ ${formatMonthDay(report.end, locale)}`;
	const isLatest = start === null || start >= latestStart(period);
	const illustration = <Illustration scene={t('report.emptyScene')} icon={ChartNoAxesColumnIcon} height={180} />;

	return (
		<View>
			{/*제목*/}
			<ScreenHeader title={t('report.title')} large />

			{/*오늘, 이번 주, 이번 달 선택 버튼*/}
			<View style={ui.controlsRow}>
				{reportPeriodSchema.options.map((periodOption) => (
					<Chip
						key={periodOption}
						label={t(`report.periods.${periodOption}`)}
						selected={period === periodOption}
						onPress={() => selectPeriod(periodOption)}
					/>
				))}
			</View>

			{/*기간과 학습 시간*/}
			<Card style={styles.card}>
				<View style={ui.controlsRow}>
					<Copy accessibilityRole="header" style={styles.period}>
						{periodLabel}
					</Copy>
					<IconButton icon={ChevronLeftIcon} label={t('report.previous')} onPress={() => movePeriod(-1)} />
					<IconButton
						icon={ChevronRightIcon}
						label={t('report.next')}
						disabled={isLatest}
						onPress={() => movePeriod(1)}
					/>
				</View>

				{hasSessions && (
					<>
						<Copy style={styles.label}>{t('report.learningTime')}</Copy>
						<View style={styles.totalRow}>
							<Copy adjustsFontSizeToFit numberOfLines={1} style={styles.total}>
								{formatDuration(report.learning_duration_ms, locale)}
							</Copy>
						</View>

						<TrendChart
							key={`${report.period}-${report.start}`}
							period={report.period}
							trend={report.trend}
						/>
					</>
				)}
			</Card>

			{/*빈 리포트 안내*/}
			{!hasSessions && (
				<EmptyState
					message={t('report.empty')}
					illustration={illustration}
					action={{
						label: t('report.startSession'),
						onPress: () => navigation.navigate('Main', { screen: 'HomeTab' }),
					}}
				/>
			)}

			{/*단어별 학습 시간과 세션 목록 제목*/}
			{hasSessions && (
				<>
					<WordBars words={report.words} />

					<Copy accessibilityRole="header" style={[ui.sectionTitle, styles.sessionsTitle]}>
						{t('report.sessions')}
					</Copy>
				</>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	card: { marginTop: 16 },
	period: { flex: 1, minWidth: 0, fontFamily: font.extraBold, fontSize: 16 },
	label: { marginTop: 12, fontFamily: font.extraBold, fontSize: 13.5, color: colors.muted },
	totalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12, marginBottom: 8 },
	total: { flex: 1, fontFamily: font.black, fontSize: 34, lineHeight: 40 },
	sessionsTitle: { marginTop: 24, marginBottom: 0 },
});

export default ReportHeader;
