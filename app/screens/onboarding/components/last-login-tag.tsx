import { StyleSheet, View } from 'react-native';

import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';

interface Props {
	label: string;
}

export function LastLoginTag({ label }: Props) {
	return (
		<Animated.View
			entering={FadeInDown.delay(160).springify().damping(14)}
			pointerEvents="none"
			accessible={false}
			importantForAccessibility="no-hide-descendants"
			style={styles.tag}
		>
			<Copy style={styles.text}>{label}</Copy>
			<View style={styles.pointer} />
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	tag: {
		position: 'absolute',
		top: -13,
		right: 14,
		zIndex: 1,
		minHeight: 26,
		paddingHorizontal: 11,
		justifyContent: 'center',
		borderRadius: radius.pill,
		backgroundColor: colors.brand,
		shadowColor: colors.brand,
		shadowOpacity: 0.28,
		shadowRadius: 6,
		shadowOffset: { width: 0, height: 3 },
		elevation: 3,
	},
	text: { fontFamily: font.extraBold, fontSize: 12, lineHeight: 16, color: colors.onFilled },
	pointer: {
		position: 'absolute',
		bottom: -4,
		left: '50%',
		width: 10,
		height: 10,
		marginLeft: -5,
		borderRadius: 2,
		backgroundColor: colors.brand,
		transform: [{ rotate: '45deg' }],
	},
});
