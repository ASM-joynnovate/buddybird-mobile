import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';
import Svg, { Path, Rect } from 'react-native-svg';

import { useReportStore } from '@/stores/report';
import { colors, font } from '@/theme';
import { latestStart } from '@/utils/report-period';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const ICON_SIZE = 26;

/** 오늘로 이동하는 버튼 컴포넌트 */
const ReportHeaderTodayButton = () => {
	const { t } = useTranslation();

	const period = useReportStore((state) => state.period);
	const start = useReportStore((state) => state.start);

	const moveToLatestPeriod = useReportStore((state) => state.moveToLatestPeriod);

	const latestPeriodStart = latestStart(period);
	const latestPeriodSelected = (start ?? latestPeriodStart) >= latestPeriodStart;

	return (
		<PressableSurface
			accessibilityRole="button"
			accessibilityLabel={t('report.today')}
			accessibilityState={{ disabled: latestPeriodSelected }}
			disabled={latestPeriodSelected}
			onPress={moveToLatestPeriod}
			variant="plain"
			depth="none"
			cornerRadius="control"
			style={[styles.shell, styles.box]}
			contentStyle={[styles.face, styles.box]}
		>
			<View style={styles.calendar}>
				<Svg
					width={ICON_SIZE}
					height={ICON_SIZE}
					viewBox="0 0 24 24"
					fill="none"
					stroke={latestPeriodSelected ? colors.subtle : colors.orange}
					strokeWidth={2.2}
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<Rect x={3} y={4} width={18} height={18} rx={2} />
					<Path d="M16 2v4" />
					<Path d="M8 2v4" />
				</Svg>
				<Copy style={[styles.day, latestPeriodSelected && styles.disabledDay]}>{dayjs().date()}</Copy>
			</View>
		</PressableSurface>
	);
};

const styles = StyleSheet.create({
	shell: { flexShrink: 0 },
	box: { minWidth: 48, minHeight: 48 },
	face: { flexGrow: 0, alignItems: 'center', justifyContent: 'center' },
	calendar: { width: ICON_SIZE, height: ICON_SIZE },
	day: {
		position: 'absolute',
		top: 9,
		left: 0,
		right: 0,
		textAlign: 'center',
		fontFamily: font.black,
		fontSize: 12.5,
		lineHeight: 13,
		color: colors.orange,
		fontVariant: ['tabular-nums'],
	},
	disabledDay: { color: colors.subtle },
});

export default ReportHeaderTodayButton;
