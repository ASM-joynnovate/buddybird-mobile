import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { formatMonthDay, formatMonthDayWeekday, formatYearMonth } from '@/i18n/format';

import dayjs from 'dayjs';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react-native';

import { useDeviceSettingsStore } from '@/stores/device-settings';
import { useReportStore } from '@/stores/report';
import { font } from '@/theme';
import { latestStart } from '@/utils/report-period';

import { Copy } from '@/components/ui/copy';
import { IconButton } from '@/components/ui/icon-button';

/** 리포트 기간 이동 컴포넌트 */
const PeriodNav = () => {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const period = useReportStore((state) => state.period);
	const start = useReportStore((state) => state.start);
	const movePeriod = useReportStore((state) => state.movePeriod);

	const selectedStart = start ?? latestStart(period);
	const periodEnd = dayjs(selectedStart).add(1, period).subtract(1, 'day');
	const periodLabel =
		period === 'day'
			? formatMonthDayWeekday(selectedStart, locale)
			: period === 'month'
				? formatYearMonth(selectedStart, locale)
				: `${formatMonthDay(selectedStart, locale)} ~ ${formatMonthDay(periodEnd, locale)}`;
	const isLatest = selectedStart >= latestStart(period);

	return (
		<View style={styles.navRow}>
			<Copy accessibilityRole="header" numberOfLines={1} style={styles.period}>
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
	);
};

const styles = StyleSheet.create({
	navRow: { flexDirection: 'row', alignItems: 'center' },
	period: { flex: 1, minWidth: 0, fontFamily: font.extraBold, fontSize: 14.5 },
});

export default PeriodNav;
