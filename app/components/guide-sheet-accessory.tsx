import { useEffect } from 'react';

import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTranslation } from 'react-i18next';

import Animated, {
	type AnimatedRef,
	type AnimatedStyle,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withSequence,
	withTiming,
} from 'react-native-reanimated';

import Mascot from '@/components/mascot';
import { PageDots } from '@/components/ui/page-dots';

const MASCOT_SIZE = 96;
const HOP_HEIGHT = 12;
const HOP_UP_MS = 180;
const HOP_DOWN_MS = 270;

interface Props {
	stepIndex: number;
	stepCount: number;
	buddyRef?: AnimatedRef<Animated.View>;
	buddyStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
}

/**
 * 안내 단계의 버디 및 진행 점 컴포넌트
 * @param stepIndex 현재 단계 순서
 * @param stepCount 전체 단계 수
 * @param buddyRef 버디 위치 측정용 ref
 * @param buddyStyle 버디에 더할 애니메이션 스타일
 */
const GuideSheetAccessory = ({ stepIndex, stepCount, buddyRef, buddyStyle }: Props) => {
	const { t } = useTranslation();

	const motionReduced = useReducedMotion();

	const mascotY = useSharedValue(0);

	const mascotHopStyle = useAnimatedStyle(() => ({ transform: [{ translateY: mascotY.get() }] }));

	/** 단계 변경 시 버디가 한 번 점프 */
	useEffect(() => {
		if (motionReduced) {
			return;
		}

		mascotY.set(
			withSequence(withTiming(-HOP_HEIGHT, { duration: HOP_UP_MS }), withTiming(0, { duration: HOP_DOWN_MS })),
		);
	}, [mascotY, motionReduced, stepIndex]);

	return (
		<View style={styles.container}>
			<Animated.View ref={buddyRef} style={[styles.mascotContainer, mascotHopStyle, buddyStyle]}>
				<Mascot size={MASCOT_SIZE} />
			</Animated.View>
			<PageDots
				count={stepCount}
				currentIndex={stepIndex}
				label={t('common.stepProgress', { current: stepIndex + 1, total: stepCount })}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { minHeight: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
	mascotContainer: { position: 'absolute', left: -4, top: -82 },
});

export default GuideSheetAccessory;
