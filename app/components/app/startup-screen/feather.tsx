import { useEffect } from 'react';

import { StyleSheet } from 'react-native';

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

import { SECOND } from '@/config/units';
import { colors } from '@/theme';

const FEATHER_ASPECT_RATIO = 24 / 40;
const START_SPREAD = 60;
const WIDTH_RANGE = [16, 24] as const;
const SWAY_RANGE = [14, 30] as const;
const FALL_RANGE = [170, 230] as const;
const TURN_RANGE = [-220, 220] as const;
const WOBBLE_RANGE = [14, 30] as const;
const DURATION_RANGE = [2.4 * SECOND, 3.2 * SECOND] as const;
const FULL_TURN = 360;

const MOVE_STOPS = [0, 0.26, 0.5, 0.74, 1];
const FADE_STOPS = [0, 0.08, 0.9, 1];

const fallEasing = Easing.bezier(0.4, 0, 0.6, 1);

export interface FeatherDrop {
	id: string;
	delay: number;
	x: number;
	y: number;
	width: number;
	sway: number;
	fall: number;
	startAngle: number;
	turn: number;
	wobble: number;
	duration: number;
}

/** 범위 안의 무작위 수를 반환하는 함수 */
const randomIn = ([min, max]: readonly [number, number]) => min + Math.random() * (max - min);

/**
 * 깃털의 움직임을 무작위로 정하는 함수
 * @param id 깃털 ID
 * @param x 떨어지기 시작하는 가로 위치
 * @param y 떨어지기 시작하는 세로 위치
 * @param delay 떨어지기 전에 기다리는 시간
 */
export const createFeatherDrop = (id: string, x: number, y: number, delay: number): FeatherDrop => {
	const width = randomIn(WIDTH_RANGE);

	return {
		id,
		delay,
		x: x - width / 2 + randomIn([-START_SPREAD, START_SPREAD]),
		y: y - randomIn([0, START_SPREAD]),
		width,
		sway: randomIn(SWAY_RANGE),
		fall: randomIn(FALL_RANGE),
		startAngle: randomIn([0, FULL_TURN]),
		turn: randomIn(TURN_RANGE),
		wobble: randomIn(WOBBLE_RANGE),
		duration: randomIn(DURATION_RANGE),
	};
};

interface Props {
	drop: FeatherDrop;
	onEnd: (id: string) => void;
}

/**
 * 흔들리며 떨어지는 깃털 컴포넌트
 * @param drop 깃털의 움직임
 * @param onEnd 다 떨어진 뒤 실행할 함수
 */
const Feather = ({ drop, onEnd }: Props) => {
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

	/** 마운트되면 깃털을 떨어뜨림 */
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

export default Feather;
