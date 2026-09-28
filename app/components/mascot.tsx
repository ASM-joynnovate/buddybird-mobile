import { useEffect } from 'react';

import { Image, StyleSheet } from 'react-native';

import { useTranslation } from 'react-i18next';

import Animated, {
	cancelAnimation,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from 'react-native-reanimated';

import { mascotImage } from '@/theme';
import { SECOND } from '@/utils/units';

interface Props {
	size?: number;
}

export function Mascot({ size = 120 }: Props) {
	const { t } = useTranslation();

	const reducedMotion = useReducedMotion();

	const y = useSharedValue(0);
	const rotation = useSharedValue(0);
	const floatStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: y.get() }, { rotate: `${rotation.get()}deg` }],
	}));

	useEffect(() => {
		if (reducedMotion) {
			return;
		}

		const duration = SECOND;

		y.set(withRepeat(withSequence(withTiming(-size * 0.05, { duration }), withTiming(0, { duration })), -1));
		rotation.set(
			withRepeat(
				withSequence(withTiming(-2, { duration }), withTiming(2, { duration }), withTiming(0, { duration })),
				-1,
			),
		);

		return () => {
			cancelAnimation(y);
			cancelAnimation(rotation);
		};
	}, [reducedMotion, rotation, size, y]);

	return (
		<Animated.View
			accessible
			accessibilityRole="image"
			accessibilityLabel={t('common.mascot')}
			style={[styles.frame, { width: size }, floatStyle]}
		>
			<Image
				source={mascotImage}
				resizeMode="contain"
				style={[StyleSheet.absoluteFill, styles.image]}
				accessibilityIgnoresInvertColors
			/>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	frame: { maxWidth: '100%', aspectRatio: 1, flexShrink: 0 },
	image: { width: '100%', height: '100%' },
});
