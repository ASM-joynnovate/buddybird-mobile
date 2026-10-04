import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import type { LucideIcon } from 'lucide-react-native';

import { colors, radius } from '@/theme';

import Mascot from '@/components/mascot';

interface Props {
	scene: string;
	icon: LucideIcon;
	height?: number;
	showMascot?: boolean;
}

/**
 * 장면 그림 컴포넌트
 * @param scene 접근성 라벨에 넣을 장면 이름
 * @param icon 장면을 나타내는 아이콘
 * @param height 그림 높이
 * @param showMascot 마스코트 표시 여부
 */
const Illustration = ({ scene, icon: Icon, height = 220, showMascot = true }: Props) => {
	const { t } = useTranslation();

	return (
		<View
			accessible
			accessibilityRole="image"
			accessibilityLabel={t('common.illustration', { scene })}
			style={[styles.container, { height }]}
		>
			{showMascot && <Mascot size={Math.round(height * 0.55)} />}

			{/*장면 아이콘*/}
			<View style={showMascot ? styles.badge : styles.centered}>
				<Icon size={showMascot ? 26 : 40} color={colors.orangeDark} />
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		alignSelf: 'stretch',
		borderRadius: radius.illustration,
		borderCurve: 'continuous',
		backgroundColor: colors.orangePale,
		alignItems: 'center',
		justifyContent: 'center',
	},
	badge: {
		position: 'absolute',
		right: 18,
		bottom: 18,
		width: 52,
		height: 52,
		borderRadius: 26,
		backgroundColor: colors.background,
		borderWidth: 2,
		borderColor: colors.orangeSoft,
		alignItems: 'center',
		justifyContent: 'center',
	},
	centered: {
		width: 88,
		height: 88,
		borderRadius: 44,
		backgroundColor: colors.background,
		borderWidth: 2,
		borderColor: colors.orangeSoft,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default Illustration;
