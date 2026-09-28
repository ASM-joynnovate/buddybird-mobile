import { type ReactElement, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import type { Report } from '@/types/apis/reports';

import type { ReportPeriod } from '@/types/report-period';

import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { formatDateWithWeekday, formatDuration } from '@/i18n/format';

import dayjs, { type Dayjs } from 'dayjs';

import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const CHART_HEIGHT = 150;
const MIN_BAR = 3;

type Bucket = Report['trend'][number];

/** 기간에 맞춘 막대 아래 축 글자 */
const formatAxisLabel = (period: ReportPeriod, date: Dayjs, t: TFunction) => {
	if (period === 'week') {
		return date.format('ddd');
	}

	if (period === 'day') {
		return date.hour() % 6 === 0 ? t('report.hour', { hour: date.hour() }) : '';
	}

	return (date.date() - 1) % 7 === 0 ? String(date.date()) : '';
};

interface Props {
	period: ReportPeriod;
	trend: Bucket[];
}

export function TrendChart({ period, trend }: Props): ReactElement {
	const { t } = useTranslation();

	const [selected, setSelected] = useState<number | null>(null);

	const locale = useDeviceSettingsStore((state) => state.locale);

	const max = Math.max(1, ...trend.map((bucket) => bucket.learning_duration_ms));
	const describe = (bucket: Bucket) =>
		t('report.bar', {
			label: period === 'day' ? dayjs(bucket.start).format('LT') : formatDateWithWeekday(bucket.start, locale),
			duration: formatDuration(bucket.learning_duration_ms, locale),
		});
	const picked = selected === null ? null : trend[selected];

	return (
		<View>
			{/*고른 막대의 날짜와 학습 시간*/}
			<Copy accessibilityLiveRegion="polite" style={styles.detail}>
				{picked ? describe(picked) : ' '}
			</Copy>

			{/*학습 시간 막대*/}
			<View style={[styles.bars, period === 'week' ? styles.wide : styles.narrow]}>
				{trend.map((bucket, index) => (
					<PressableSurface
						key={bucket.start}
						variant="plain"
						depth="none"
						cornerRadius="xsmall"
						accessibilityLabel={describe(bucket)}
						accessibilityState={{ selected: selected === index }}
						onPress={() => setSelected(selected === index ? null : index)}
						style={styles.column}
						contentStyle={styles.columnFace}
					>
						<View
							style={[
								styles.bar,
								{
									height: Math.max(MIN_BAR, (bucket.learning_duration_ms / max) * CHART_HEIGHT),
								},
								bucket.learning_duration_ms === 0 && styles.empty,
								selected === index && styles.selected,
							]}
						/>
					</PressableSurface>
				))}
			</View>

			{/*막대 아래 축 글자*/}
			<View
				style={[styles.axis, period === 'week' ? styles.wide : styles.narrow]}
				accessibilityElementsHidden
				importantForAccessibility="no-hide-descendants"
			>
				{trend.map((bucket) => (
					<View key={bucket.start} style={styles.column}>
						<Copy numberOfLines={1} style={styles.axisText}>
							{formatAxisLabel(period, dayjs(bucket.start), t)}
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
	wide: { gap: 8 },
	narrow: { gap: 2 },
	column: { flex: 1, minWidth: 0, justifyContent: 'flex-end', alignItems: 'center' },
	columnFace: { flexGrow: 1, borderWidth: 0, justifyContent: 'flex-end', alignSelf: 'stretch' },
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
