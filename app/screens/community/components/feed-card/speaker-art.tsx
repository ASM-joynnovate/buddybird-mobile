import { StyleSheet, View } from 'react-native';

import Svg, { Circle, Path } from 'react-native-svg';

import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';

interface Props {
	countText: string;
}

/**
 * 단어 재생 횟수 스피커 그림 컴포넌트
 * @param countText 스피커 아래에 표시할 횟수
 */
const FeedCardSpeakerArt = ({ countText }: Props) => {
	return (
		<View style={styles.container}>
			<Svg width={44} height={48} viewBox="22 0 60 66">
				<Circle cx={52} cy={34} r={30} fill={colors.orangeDark} />
				<Circle cx={52} cy={31} r={30} fill={colors.orange} />
				<Path
					d="M38 24h8l10-8v30l-10-8h-8Z"
					fill={colors.onFilled}
					stroke={colors.onFilled}
					strokeWidth={3}
					strokeLinejoin="round"
				/>
				<Path
					d="M62 22c4 5 4 13 0 18M68 17c7 8 7 20 0 28"
					fill="none"
					stroke={colors.onFilled}
					strokeWidth={3.5}
					strokeLinecap="round"
				/>
			</Svg>

			<Copy adjustsFontSizeToFit numberOfLines={1} style={styles.count}>
				{countText}
			</Copy>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { alignSelf: 'stretch', alignItems: 'center' },
	count: {
		alignSelf: 'stretch',
		marginTop: 12,
		fontFamily: font.black,
		fontSize: 16,
		lineHeight: 20,
		textAlign: 'center',
	},
});

export default FeedCardSpeakerArt;
