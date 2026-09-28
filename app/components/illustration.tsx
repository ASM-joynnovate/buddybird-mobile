import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import type { LucideIcon } from 'lucide-react-native';

import { colors, radius } from '@/theme';

import { Mascot } from '@/components/mascot';

interface Props {
	scene: string;
	icon: LucideIcon;
	height?: number;
	showMascot?: boolean;
}

export function Illustration({ scene, icon: Icon, height = 220, showMascot = true }: Props) {
	const { t } = useTranslation();

	return (
		<View
			accessible
			accessibilityRole="image"
			accessibilityLabel={t('common.illustration', { scene })}
			style={[styles.panel, { height }]}
		>
			{showMascot ? <Mascot size={Math.round(height * 0.55)} /> : null}
			<View style={showMascot ? styles.badge : styles.centered}>
				<Icon size={showMascot ? 26 : 40} color={colors.orangeDark} />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	panel: {
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
