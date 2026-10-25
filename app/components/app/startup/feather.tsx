import { useEffect } from 'react';

import { StyleSheet } from 'react-native';

import type { FeatherDrop } from '@/types/startup';

import Animated, {
	cancelAnimation,
	Easing,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { colors } from '@/theme';

const FEATHER_ASPECT_RATIO = 24 / 40;

const MOVE_STOPS = [0, 0.26, 0.5, 0.74, 1];
const FADE_STOPS = [0, 0.08, 0.9, 1];

const fallEasing = Easing.bezier(0.4, 0, 0.6, 1);

interface Props {
	drop: FeatherDrop;
	onEnd: (id: string) => void;
}

/**
 * 흔들리며 떨어지는 깃털 컴포넌트
 * @param drop 깃털 애니메이션 값
 * @param onEnd 다 떨어진 뒤 실행할 함수
 */
const StartupScreenFeather = ({ drop, onEnd }: Props) => {
	const progress = useSharedValue(0);

	const featherStyle = useAnimatedStyle(() => {
		const { x, y, sway, fall, startAngle, turn, wobble } = drop;
		const angle = interpolate(progress.get(), MOVE_STOPS, [
			startAngle,
			startAngle + turn * 0.26 - wobble,
			startAngle + turn * 0.52 + wobble,
			startAngle + turn * 0.78 - wobble,
			startAngle + turn,
		]);

		return {
			opacity: interpolate(progress.get(), FADE_STOPS, [0, 1, 1, 0]),
			transform: [
				{
					translateX: interpolate(progress.get(), MOVE_STOPS, [
						x,
						x - sway,
						x + sway,
						x - sway * 0.6,
						x + sway * 0.3,
					]),
				},
				{
					translateY: interpolate(progress.get(), MOVE_STOPS, [
						y,
						y + fall * 0.26,
						y + fall * 0.52,
						y + fall * 0.78,
						y + fall,
					]),
				},
				{ rotate: `${angle}deg` },
			],
		};
	});

	/** 마운트 시 깃털 낙하 애니메이션 실행 */
	useEffect(() => {
		progress.set(
			withDelay(
				drop.delay,
				withTiming(1, { duration: drop.duration, easing: fallEasing }, (finished) => {
					if (finished) {
						scheduleOnRN(onEnd, drop.id);
					}
				}),
			),
		);

		return () => cancelAnimation(progress);
	}, [drop, onEnd, progress]);

	return (
		<Animated.View
			pointerEvents="none"
			style={[styles.feather, { width: drop.width, height: drop.width / FEATHER_ASPECT_RATIO }, featherStyle]}
		>
			<Svg width="100%" height="100%" viewBox="0 0 24 40">
				<Path d="M12 2C5 10 4 22 12 34C20 22 19 10 12 2Z" fill={colors.brand} />
				<Path d="M12 9V39" stroke={colors.brandDark} strokeWidth={1.6} strokeLinecap="round" />
			</Svg>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	feather: { position: 'absolute', top: 0, left: 0 },
});

export default StartupScreenFeather;
