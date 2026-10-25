import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import Svg, { Circle, Path } from 'react-native-svg';

import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';

interface Props {
	hoursText: string;
}

/**
 * 학습 시간 메달 그림 컴포넌트
 * @param hoursText 메달에 표시할 시간
 */
const FeedCardMedalArt = ({ hoursText }: Props) => {
	const { t } = useTranslation();

	return (
		<View style={styles.container}>
			<Svg width={64} height={74} viewBox="0 0 76 88">
				<Path d="M24 52 15 84l11-5 6 9 7-29Z" fill={colors.blueDark} />
				<Path d="M52 52l9 32-11-5-6 9-7-29Z" fill={colors.blueDark} />
				<Circle cx={38} cy={34} r={31} fill={colors.blueDark} />
				<Circle cx={38} cy={34} r={27} fill={colors.blue} />
				<Circle
					cx={38}
					cy={34}
					r={22}
					fill="none"
					stroke={colors.onFilled}
					strokeOpacity={0.5}
					strokeWidth={2}
					strokeDasharray="2 4"
				/>
			</Svg>

			<View style={styles.label}>
				<Copy adjustsFontSizeToFit numberOfLines={1} style={styles.hours}>
					{hoursText}
				</Copy>
				<Copy style={styles.unit}>{t('community.feed.artHours')}</Copy>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { width: 64, height: 74 },
	label: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		height: 57,
		alignItems: 'center',
		justifyContent: 'center',
	},
	hours: {
		width: 36,
		fontFamily: font.black,
		fontSize: 18,
		lineHeight: 20,
		textAlign: 'center',
		color: colors.onFilled,
	},
	unit: { fontFamily: font.extraBold, fontSize: 8, lineHeight: 10, color: colors.onFilled },
});

export default FeedCardMedalArt;
