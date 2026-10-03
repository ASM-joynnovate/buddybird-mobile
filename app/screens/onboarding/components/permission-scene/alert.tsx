import { Image, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTranslation } from 'react-i18next';

import Animated, {
	Extrapolation,
	interpolate,
	type SharedValue,
	useAnimatedStyle,
	useReducedMotion,
} from 'react-native-reanimated';

import { appIconImage, colors, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';

interface Props {
	cycle: SharedValue<number>;
	style?: StyleProp<ViewStyle>;
}

/**
 * 학습이 끝나면 위에서 내려오는 알림 컴포넌트
 * @param cycle 0에서 1 사이의 장면 반복 진행도
 * @param style 알림 위치
 */
const PermissionSceneAlert = ({ cycle, style }: Props) => {
	const { t } = useTranslation();

	const reducedMotion = useReducedMotion();

	const alertStyle = useAnimatedStyle(() => {
		if (reducedMotion) {
			return { opacity: 1 };
		}

		const progress = cycle.get();

		return {
			opacity: interpolate(progress, [0.5, 0.58, 0.92, 1], [0, 1, 1, 0], Extrapolation.CLAMP),
			transform: [
				{ translateY: interpolate(progress, [0.5, 0.58, 0.92, 1], [-14, 0, 0, -6], Extrapolation.CLAMP) },
			],
		};
	});

	return (
		<Animated.View style={[styles.alert, style, alertStyle]}>
			<Image source={appIconImage} accessibilityIgnoresInvertColors style={styles.appIcon} />

			<View style={styles.body}>
				<View style={styles.header}>
					<Copy style={styles.meta}>{t('onboarding.permissions.alert.appName')}</Copy>
					<Copy style={styles.meta}>{t('onboarding.permissions.alert.time')}</Copy>
				</View>
				<Copy style={styles.message}>{t('onboarding.permissions.alert.message')}</Copy>
			</View>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	alert: {
		position: 'absolute',
		minWidth: 190,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderWidth: 2,
		borderColor: colors.border,
		borderRadius: radius.control,
		borderCurve: 'continuous',
		backgroundColor: colors.background,
	},
	appIcon: { width: 34, height: 34, borderRadius: radius.small },
	body: { flexGrow: 1, flexShrink: 1, minWidth: 0 },
	header: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
	meta: { fontFamily: font.extraBold, fontSize: 11, lineHeight: 14, color: colors.muted },
	message: { fontFamily: font.black, fontSize: 14, lineHeight: 20 },
});

export default PermissionSceneAlert;
