import type { ReactElement } from 'react';

import { StyleSheet, View } from 'react-native';

import type { Report } from '@/types/apis/reports';

import type { Locale } from '@/types/locale';
import { reportPeriodSchema } from '@/types/report-period';

import { useTranslation } from 'react-i18next';

import { formatDate, formatDateWithWeekday, formatDuration, formatMonth } from '@/i18n/format';

import { ChartNoAxesColumnIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react-native';

import { TrendChart } from '@/screens/report/components/report-header/trend-chart';
import { WordBars } from '@/screens/report/components/report-header/word-bars';
import type { ReportPeriodState } from '@/screens/report/hooks/use-report-period';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';

import { Illustration } from '@/components/illustration';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ui } from '@/components/ui/styles';
import { Card } from '@/components/ui/surface';
import { Copy } from '@/components/ui/text';

function periodLabel(report: Report, locale: Locale): string {
	if (report.period === 'day') {
		return formatDateWithWeekday(report.start, locale);
	}

	if (report.period === 'month') {
		return formatMonth(report.start, locale);
	}

	return `${formatDate(report.start, locale)} ~ ${formatDate(report.end, locale)}`;
}

interface Props {
	state: ReportPeriodState;
	report: Report;
	onStart(): void;
}

export function ReportHeader({ state, report, onStart }: Props): ReactElement {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((settings) => settings.locale);

	const recorded = report.sessions.length > 0;
	const label = periodLabel(report, locale);
	const illustration = <Illustration scene={t('report.emptyScene')} icon={ChartNoAxesColumnIcon} height={180} />;

	return (
		<View>
			{/*제목*/}
			<ScreenHeader title={t('report.title')} large />

			{/*기간 칩*/}
			<View style={ui.row}>
				{reportPeriodSchema.options.map((period) => (
					<Chip
						key={period}
						label={t(`report.periods.${period}`)}
						selected={state.period === period}
						onPress={() => state.select(period)}
					/>
				))}
			</View>

			{/*기간과 학습 시간*/}
			<Card style={styles.card}>
				<View style={ui.row}>
					<Copy accessibilityRole="header" style={styles.period}>
						{label}
					</Copy>
					<IconButton icon={ChevronLeftIcon} label={t('report.previous')} onPress={() => state.move(-1)} />
					<IconButton
						icon={ChevronRightIcon}
						label={t('report.next')}
						disabled={state.isLatest}
						onPress={() => state.move(1)}
					/>
				</View>

				{recorded ? (
					<>
						<Copy style={styles.label}>{t('report.learningTime')}</Copy>
						<View style={styles.totals}>
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
				) : null}
			</Card>

			{/*빈 리포트 안내*/}
			{!recorded ? (
				<EmptyState
					message={t('report.empty')}
					illustration={illustration}
					action={{ label: t('report.startSession'), onPress: onStart }}
				/>
			) : null}

			{/*단어별 학습 시간과 세션 목록 제목*/}
			{recorded ? (
				<>
					<WordBars words={report.words} />

					<Copy accessibilityRole="header" style={[ui.sectionTitle, styles.sessions]}>
						{t('report.sessions')}
					</Copy>
				</>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	card: { marginTop: 16 },
	period: { flex: 1, minWidth: 0, fontFamily: font.extraBold, fontSize: 16 },
	label: { marginTop: 12, fontFamily: font.extraBold, fontSize: 13.5, color: colors.muted },
	totals: { flexDirection: 'row', alignItems: 'baseline', gap: 12, marginBottom: 8 },
	total: { flex: 1, fontFamily: font.black, fontSize: 34, lineHeight: 40 },
	sessions: { marginTop: 24, marginBottom: 0 },
});
