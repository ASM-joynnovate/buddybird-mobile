import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import Svg, { Path, Rect } from 'react-native-svg';

import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';

interface Props {
	monthLabel: string;
	hoursText: string;
}

/**
 * 월 학습 시간 달력 그림 컴포넌트
 * @param monthLabel 달력 위쪽에 표시할 달
 * @param hoursText 달력에 표시할 시간
 */
const FeedCardCalendarArt = ({ monthLabel, hoursText }: Props) => {
	const { t } = useTranslation();

	return (
		<View style={styles.container}>
			<Svg width={64} height={67} viewBox="0 0 92 96">
				<Rect x={6} y={12} width={80} height={80} rx={16} fill={colors.greenDark} />
				<Rect
					x={6}
					y={10}
					width={80}
					height={76}
					rx={16}
					fill={colors.background}
					stroke={colors.green}
					strokeWidth={4}
				/>
				<Path d="M6 26a16 16 0 0 1 16-16h48a16 16 0 0 1 16 16v6H6Z" fill={colors.green} />
				<Rect x={24} y={2} width={8} height={18} rx={4} fill={colors.greenDark} />
				<Rect x={60} y={2} width={8} height={18} rx={4} fill={colors.greenDark} />
			</Svg>

			<View style={styles.monthLabel}>
				<Copy style={styles.month}>{monthLabel}</Copy>
			</View>
			<View style={styles.hoursLabel}>
				<Copy style={styles.hours}>{hoursText}</Copy>
				<Copy style={styles.unit}>{t('community.feed.artHours')}</Copy>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { width: 64, height: 67 },
	monthLabel: {
		position: 'absolute',
		top: 7,
		left: 0,
		right: 0,
		height: 15,
		alignItems: 'center',
		justifyContent: 'center',
	},
	hoursLabel: {
		position: 'absolute',
		top: 22,
		left: 0,
		right: 0,
		height: 38,
		alignItems: 'center',
		justifyContent: 'center',
	},
	month: { fontFamily: font.black, fontSize: 8, lineHeight: 10, color: colors.onFilled },
	hours: { fontFamily: font.black, fontSize: 20, lineHeight: 22, color: colors.text },
	unit: { fontFamily: font.extraBold, fontSize: 7, lineHeight: 9, color: colors.muted },
});

export default FeedCardCalendarArt;
