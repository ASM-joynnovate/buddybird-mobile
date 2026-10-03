import { useEffect } from 'react';

import { StyleSheet } from 'react-native';

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

import { SECOND } from '@/config/units';

import MascotArtwork from '@/components/mascot/mascot-artwork';

interface Props {
	size?: number;
	floating?: boolean;
}

/**
 * 마스코트 컴포넌트
 * @param size 그림 크기
 * @param floating 위아래로 움직이는지 여부
 */
const Mascot = ({ size = 120, floating = true }: Props) => {
	const { t } = useTranslation();

	const reducedMotion = useReducedMotion();

	const y = useSharedValue(0);
	const rotation = useSharedValue(0);

	const floatStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: y.get() }, { rotate: `${rotation.get()}deg` }],
	}));

	/** 움직임 줄이기 설정이 꺼져 있으면 애니메이션 반복 */
	useEffect(() => {
		if (reducedMotion || !floating) {
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
	}, [floating, reducedMotion, rotation, size, y]);

	return (
		<Animated.View
			accessible
			accessibilityRole="image"
			accessibilityLabel={t('common.mascot')}
			style={[styles.container, { width: size }, floatStyle]}
		>
			<MascotArtwork />
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: { maxWidth: '100%', aspectRatio: 1, flexShrink: 0 },
});

export default Mascot;
