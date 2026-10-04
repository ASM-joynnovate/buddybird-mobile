import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import type { Report } from '@/types/apis/reports';

import type { Locale } from '@/types/locale';
import type { ReportPeriod } from '@/types/report-period';

import { getReportOptions } from '@/hooks/apis/reports';

import { useTranslation } from 'react-i18next';

import { formatDuration, formatMonthDay } from '@/i18n/format';

import dayjs from 'dayjs';
import Svg, { Line } from 'react-native-svg';

import CumulativeChart from '@/screens/report/components/report-header/cumulative-chart';
import TrendPaneSkeleton from '@/screens/report/components/report-header/trend-pane-skeleton';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { useReportStore } from '@/stores/report';
import { colors, font, radius } from '@/theme';
import { latestStart, shiftedStart } from '@/utils/report-period';

import { Copy } from '@/components/ui/copy';

type TrendBucket = Report['learning']['trend'][number];

/** 구간별 학습 시간을 0부터 시작하는 누적 학습 시간 목록으로 변환하는 함수 */
const cumulativeTotals = (trend: TrendBucket[]) => {
	return [
		0,
		...trend.map((_, index) =>
			trend.slice(0, index + 1).reduce((totalMs, bucket) => totalMs + bucket.duration_ms, 0),
		),
	];
};

/** 구간 이름을 반환하는 함수 */
const formatBucket = (period: ReportPeriod, bucket: TrendBucket, locale: Locale) => {
	if (period === 'day') {
		return dayjs(bucket.start).format('LT');
	}

	return period === 'week' ? dayjs(bucket.start).format('dddd') : formatMonthDay(bucket.start, locale);
};

/** 구간이 끝나는 때의 이름을 반환하는 함수 */
const formatBucketEnd = (period: ReportPeriod, bucket: TrendBucket, locale: Locale) => {
	return period === 'day' ? dayjs(bucket.start).add(1, 'hour').format('LT') : formatBucket(period, bucket, locale);
};

interface Props {
	start: string;
	lineAnimated: boolean;
	onScrubChange: (scrubbing: boolean) => void;
}

/**
 * 기간별 누적 학습 시간 컴포넌트
 * @param start 기간의 시작 날짜
 * @param lineAnimated 선이 그려지는 움직임 실행 여부
 * @param onScrubChange 그래프를 훑기 시작하거나 멈출 때 실행할 함수
 */
const TrendPane = ({ start, lineAnimated, onScrubChange }: Props) => {
	const { t } = useTranslation();

	const [scrubIndex, setScrubIndex] = useState<number | null>(null);

	const locale = useDeviceSettingsStore((state) => state.locale);

	const period = useReportStore((state) => state.period);

	const { data: reportData } = useQuery({ ...getReportOptions({ period, start }), throwOnError: false });
	const { data: previousReportData } = useQuery({
		...getReportOptions({ period, start: shiftedStart(period, start, -1) }),
		throwOnError: false,
	});

	if (!reportData || !previousReportData) {
		return <TrendPaneSkeleton />;
	}

	const trend = reportData.learning.trend;
	const startedBucketCount = trend.filter((bucket) => dayjs(bucket.start).isBefore(dayjs())).length;
	const currentTotalsMs = cumulativeTotals(trend).slice(0, startedBucketCount + 1);
	const previousTotalsMs = cumulativeTotals(previousReportData.learning.trend);
	const shownIndex = scrubIndex ?? startedBucketCount;
	const previousShownMs = previousTotalsMs[Math.min(shownIndex, previousTotalsMs.length - 1)];
	const changeMs = currentTotalsMs[shownIndex] - previousShownMs;
	const scrubbedBucket = scrubIndex === null ? null : trend[scrubIndex - 1];

	const periodName = start === latestStart(period) ? t(`report.periods.${period}`) : t('report.selectedPeriod');
	const previousPeriodName = t(`report.previousPeriods.${period}`);
	const totalLabel = formatDuration(reportData.learning.duration_ms, locale);
	const previousTotalLabel = formatDuration(previousReportData.learning.duration_ms, locale);
	const changeLabel =
		changeMs === 0
			? t('report.noChange')
			: `${changeMs > 0 ? '+' : '-'}${formatDuration(Math.abs(changeMs), locale)}`;

	const handleScrub = (index: number | null) => {
		setScrubIndex(
			index === null || startedBucketCount === 0 ? null : Math.min(Math.max(index, 1), startedBucketCount),
		);
		onScrubChange(index !== null);
	};

	return (
		<View>
			{/*이 기간과 지난 기간의 학습 시간*/}
			<View style={styles.totalsRow}>
				<View style={styles.currentContainer}>
					<View style={styles.legendRow}>
						<View style={styles.currentSwatch} />
						<Copy numberOfLines={1} style={styles.legendText}>
							{scrubbedBucket
								? t('report.until', { label: formatBucketEnd(period, scrubbedBucket, locale) })
								: periodName}
						</Copy>
					</View>
					<Copy adjustsFontSizeToFit numberOfLines={1} style={styles.currentTotal}>
						{scrubbedBucket ? formatDuration(currentTotalsMs[shownIndex], locale) : totalLabel}
					</Copy>
				</View>

				<View style={styles.previousContainer}>
					<View style={styles.legendRow}>
						<Svg width={18} height={4}>
							<Line
								x1={2}
								x2={16}
								y1={2}
								y2={2}
								stroke={colors.subtle}
								strokeWidth={4}
								strokeLinecap="round"
								strokeDasharray="0.1 6"
							/>
						</Svg>
						<Copy style={styles.legendText}>{previousPeriodName}</Copy>
					</View>
					<Copy style={styles.previousTotal}>
						{scrubbedBucket ? formatDuration(previousShownMs, locale) : previousTotalLabel}
					</Copy>
				</View>
			</View>
			<Copy style={[styles.changeText, changeMs > 0 && styles.increasedText]}>
				{t(`report.change.${period}`, { change: changeLabel })}
			</Copy>

			<CumulativeChart
				period={period}
				trend={trend}
				currentTotalsMs={currentTotalsMs}
				previousTotalsMs={previousTotalsMs}
				scrubIndex={scrubbedBucket ? shownIndex : null}
				tooltip={
					scrubbedBucket && {
						title: formatBucket(period, scrubbedBucket, locale),
						detail: t('report.bucketDuration', {
							duration: formatDuration(scrubbedBucket.duration_ms, locale),
						}),
					}
				}
				lineAnimated={lineAnimated}
				accessibilityLabel={t('report.chartLabel', {
					period: periodName,
					duration: totalLabel,
					previousPeriod: previousPeriodName,
					previousDuration: previousTotalLabel,
				})}
				onScrub={handleScrub}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	totalsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 4 },
	currentContainer: { flex: 1, minWidth: 0 },
	previousContainer: { alignItems: 'flex-end', paddingBottom: 3 },
	legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
	currentSwatch: { width: 18, height: 5, borderRadius: radius.pill, backgroundColor: colors.orange },
	legendText: { fontFamily: font.extraBold, fontSize: 12.5, lineHeight: 18, color: colors.muted },
	currentTotal: { fontFamily: font.black, fontSize: 28, lineHeight: 34, fontVariant: ['tabular-nums'] },
	previousTotal: {
		fontFamily: font.black,
		fontSize: 16,
		lineHeight: 22,
		color: colors.muted,
		fontVariant: ['tabular-nums'],
	},
	changeText: {
		marginTop: 6,
		fontFamily: font.extraBold,
		fontSize: 12.5,
		lineHeight: 18,
		color: colors.muted,
		fontVariant: ['tabular-nums'],
	},
	increasedText: { color: colors.orangeDark },
});

export default TrendPane;
