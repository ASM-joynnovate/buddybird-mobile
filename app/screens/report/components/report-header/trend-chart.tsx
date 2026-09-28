import { type ReactElement, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import type { Report } from '@/types/apis/reports';

import type { ReportPeriod } from '@/types/report-period';

import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { formatDuration, formatMonthDayWeekday } from '@/i18n/format';

import dayjs, { type Dayjs } from 'dayjs';

import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const CHART_HEIGHT = 150;
const MIN_BAR_HEIGHT = 3;

type TrendBar = Report['trend'][number];

/** 기간에 맞춘 막대 아래 축 글자 */
const formatAxisLabel = (period: ReportPeriod, date: Dayjs, t: TFunction) => {
	if (period === 'week') {
		return date.format('ddd');
	}

	if (period === 'day') {
		return date.hour() % 6 === 0 ? t('report.chartHour', { hour: date.hour() }) : '';
	}

	return (date.date() - 1) % 7 === 0 ? String(date.date()) : '';
};

interface Props {
	period: ReportPeriod;
	trend: TrendBar[];
}

export function TrendChart({ period, trend }: Props): ReactElement {
	const { t } = useTranslation();

	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

	const locale = useDeviceSettingsStore((state) => state.locale);

	const maxDurationMs = Math.max(1, ...trend.map((trendBar) => trendBar.learning_duration_ms));
	const describeBar = (trendBar: TrendBar) =>
		t('report.chartBar', {
			label:
				period === 'day' ? dayjs(trendBar.start).format('LT') : formatMonthDayWeekday(trendBar.start, locale),
			duration: formatDuration(trendBar.learning_duration_ms, locale),
		});
	const selectedBar = selectedIndex === null ? null : trend[selectedIndex];

	return (
		<View>
			{/*고른 막대의 날짜와 학습 시간*/}
			<Copy accessibilityLiveRegion="polite" style={styles.detail}>
				{selectedBar ? describeBar(selectedBar) : ' '}
			</Copy>

			{/*학습 시간 막대*/}
			<View style={[styles.bars, period === 'week' ? styles.wideGap : styles.narrowGap]}>
				{trend.map((trendBar, index) => (
					<PressableSurface
						key={trendBar.start}
						variant="plain"
						depth="none"
						cornerRadius="xsmall"
						accessibilityLabel={describeBar(trendBar)}
						accessibilityState={{ selected: selectedIndex === index }}
						onPress={() => setSelectedIndex(selectedIndex === index ? null : index)}
						style={styles.column}
						contentStyle={styles.columnContent}
					>
						<View
							style={[
								styles.bar,
								{
									height: Math.max(
										MIN_BAR_HEIGHT,
										(trendBar.learning_duration_ms / maxDurationMs) * CHART_HEIGHT,
									),
								},
								trendBar.learning_duration_ms === 0 && styles.empty,
								selectedIndex === index && styles.selected,
							]}
						/>
					</PressableSurface>
				))}
			</View>

			{/*막대 아래 축 글자*/}
			<View
				style={[styles.axis, period === 'week' ? styles.wideGap : styles.narrowGap]}
				accessibilityElementsHidden
				importantForAccessibility="no-hide-descendants"
			>
				{trend.map((trendBar) => (
					<View key={trendBar.start} style={styles.column}>
						<Copy numberOfLines={1} style={styles.axisText}>
							{formatAxisLabel(period, dayjs(trendBar.start), t)}
						</Copy>
					</View>
				))}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	detail: {
		fontFamily: font.extraBold,
		fontSize: 13.5,
		color: colors.orangeDark,
		minHeight: 20,
		marginBottom: 6,
	},
	bars: { height: CHART_HEIGHT, flexDirection: 'row', alignItems: 'stretch' },
	wideGap: { gap: 8 },
	narrowGap: { gap: 2 },
	column: { flex: 1, minWidth: 0, justifyContent: 'flex-end', alignItems: 'center' },
	columnContent: { flexGrow: 1, borderWidth: 0, justifyContent: 'flex-end', alignSelf: 'stretch' },
	bar: { alignSelf: 'stretch', borderRadius: 4, backgroundColor: colors.orange },
	empty: { backgroundColor: colors.border },
	selected: { backgroundColor: colors.orangeDark },
	axis: { flexDirection: 'row', marginTop: 6 },
	axisText: {
		width: 36,
		textAlign: 'center',
		fontFamily: font.extraBold,
		fontSize: 12,
		color: colors.muted,
	},
});
