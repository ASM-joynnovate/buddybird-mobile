import { StyleSheet, View } from 'react-native';

import { formatMonthDayLongWeekday } from '@/i18n/format';

import { CalendarIcon } from 'lucide-react-native';

import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';

import DashedLine from '@/components/dashed-line';
import { Copy } from '@/components/ui/copy';

interface Props {
	date: string;
}

/**
 * 학습 상세 예시의 날짜 컴포넌트
 * @param date 기록 날짜
 */
const GuideSceneSessionPreviewDayBreak = ({ date }: Props) => {
	const locale = useDeviceSettingsStore((state) => state.locale);

	return (
		<View style={styles.dayBreak}>
			<View style={styles.date}>
				<CalendarIcon size={14} color={colors.onFilled} />
				<Copy style={styles.dateText}>{formatMonthDayLongWeekday(date, locale)}</Copy>
			</View>
			<View style={styles.dayLine}>
				<DashedLine color={colors.border} />
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	dayBreak: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, paddingVertical: 8 },
	date: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		height: 30,
		paddingRight: 12,
		paddingLeft: 10,
		borderRadius: 10,
		backgroundColor: colors.text,
	},
	dateText: { fontFamily: font.medium, fontSize: 13, color: colors.onFilled },
	dayLine: { flex: 1 },
});

export default GuideSceneSessionPreviewDayBreak;
