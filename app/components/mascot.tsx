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

/**
 * 위아래로 떠다니며 좌우로 기우는 마스코트 그림을 보여 주는 컴포넌트
 * @param size 그림의 가로세로 크기
 */
const Mascot = ({ size = 120 }: Props) => {
	const { t } = useTranslation();

	const reducedMotion = useReducedMotion();

	const y = useSharedValue(0);
	const rotation = useSharedValue(0);

	const floatStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: y.get() }, { rotate: `${rotation.get()}deg` }],
	}));

	/** 움직임 줄이기 설정이 꺼져 있으면 떠다니고 기우는 애니메이션 반복 */
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
			style={[styles.container, { width: size }, floatStyle]}
		>
			<Image
				source={mascotImage}
				resizeMode="contain"
				style={[StyleSheet.absoluteFill, styles.image]}
				accessibilityIgnoresInvertColors
			/>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: { maxWidth: '100%', aspectRatio: 1, flexShrink: 0 },
	image: { width: '100%', height: '100%' },
});

export default Mascot;
