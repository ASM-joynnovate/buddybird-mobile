import { memo } from 'react';

import { StyleSheet, View } from 'react-native';

import Animated, { Easing, Keyframe, LayoutAnimationConfig } from 'react-native-reanimated';

import { burstEasing, colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';

const ROLL_DISTANCE = 15;
const ROLL_IN_MS = 260;
const ROLL_OUT_MS = 150;
const LIKE_ROLL_DELAY_MS = 560;

/**
 * 새 숫자가 들어오는 애니메이션
 * @param direction 위로 넘기면 1, 아래로 넘기면 -1
 * @param delay 시작 지연 시간
 */
const rollIn = (direction: number, delay: number) => {
	return new Keyframe({
		0: { opacity: 0, transform: [{ translateY: ROLL_DISTANCE * direction }] },
		100: { opacity: 1, transform: [{ translateY: 0 }], easing: burstEasing },
	})
		.duration(ROLL_IN_MS)
		.delay(delay + 40);
};

/**
 * 이전 숫자가 나가는 애니메이션
 * @param direction 위로 넘기면 1, 아래로 넘기면 -1
 * @param delay 시작 지연 시간
 */
const rollOut = (direction: number, delay: number) => {
	return new Keyframe({
		0: { opacity: 1, transform: [{ translateY: 0 }] },
		100: { opacity: 0, transform: [{ translateY: -ROLL_DISTANCE * direction }], easing: Easing.in(Easing.quad) },
	})
		.duration(ROLL_OUT_MS)
		.delay(delay);
};

interface Props {
	countText: string;
	liked: boolean;
}

/**
 * 넘어가는 좋아요 수 컴포넌트
 * @param countText 표시할 좋아요 수
 * @param liked 좋아요 여부
 */
const FeedCardLikeButtonCount = memo(({ countText, liked }: Props) => {
	return (
		<LayoutAnimationConfig skipEntering>
			<View style={styles.container}>
				<Animated.View
					key={countText}
					entering={liked ? rollIn(1, LIKE_ROLL_DELAY_MS) : rollIn(-1, 0)}
					exiting={liked ? rollOut(-1, 0) : rollOut(1, LIKE_ROLL_DELAY_MS)}
				>
					<Copy style={[styles.count, liked && styles.countLiked]}>{countText}</Copy>
				</Animated.View>
			</View>
		</LayoutAnimationConfig>
	);
});

const styles = StyleSheet.create({
	container: { height: 20, overflow: 'hidden' },
	count: {
		fontFamily: font.extraBold,
		fontSize: 14,
		lineHeight: 20,
		color: colors.muted,
		fontVariant: ['tabular-nums'],
	},
	countLiked: { color: colors.orangeDark },
});

export default FeedCardLikeButtonCount;
