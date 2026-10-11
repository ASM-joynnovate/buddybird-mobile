import { useEffect } from 'react';

import { StyleSheet, View } from 'react-native';

import Animated, {
	type SharedValue,
	useAnimatedProps,
	useAnimatedReaction,
	useAnimatedStyle,
	useDerivedValue,
	useFrameCallback,
	useReducedMotion,
	useSharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

const REEL_COLORS = {
	shade: '#cdcdcd',
	plate: '#f4f4f4',
	rim: '#dcdcdc',
	gleam: '#ffffff',
	ring: '#4d4d4d',
	mark: '#7a7a7a',
	spoke: '#cfcfcf',
	hub: '#ffffff',
};

const VIEW_WIDTH = 86;
const VIEW_HEIGHT = 92;
const CENTER = 43;
const HUB_RADIUS = 14;
const RADIUS_STEP = 0.25;
const RING_INSETS = [5, 11];
const SPOKE_ANGLES = [0, 60, 120, 180, 240, 300];
const PLAYING_TAPE_SPEED = 0.06;
const DEGREES_PER_RADIAN = 180 / Math.PI;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface Props {
	size: number;
	side: 'left' | 'right';
	radius: SharedValue<number>;
	scrollY: SharedValue<number>;
	playing: boolean;
}

/**
 * 테이프가 감긴 릴 컴포넌트
 * @param size 릴 폭
 * @param side 테이프를 풀어 주는 왼쪽 릴인지 감는 오른쪽 릴인지
 * @param radius 감긴 테이프 반지름
 * @param scrollY 화면 스크롤 위치
 * @param playing 재생 중 여부
 */
const TapeReel = ({ size, side, radius, scrollY, playing }: Props) => {
	const reducedMotion = useReducedMotion();

	const angle = useSharedValue(0);

	const direction = side === 'right' ? 1 : -1;
	const height = Math.round((size * VIEW_HEIGHT) / VIEW_WIDTH);
	const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.get()}deg` }] }));

	// 화면 한 픽셀보다 작은 변화는 다시 그리지 않음
	const drawnRadius = useDerivedValue(() => Math.round(radius.get() / RADIUS_STEP) * RADIUS_STEP);
	const tapeProps = useAnimatedProps(() => ({ r: drawnRadius.get() }));
	const innerRingProps = useAnimatedProps(() => ({ r: Math.max(drawnRadius.get() - RING_INSETS[0], 0) }));
	const outerRingProps = useAnimatedProps(() => ({ r: Math.max(drawnRadius.get() - RING_INSETS[1], 0) }));
	const markProps = useAnimatedProps(() => ({ y: CENTER - drawnRadius.get() + 1 }));

	/** 테이프가 움직인 거리를 반지름으로 나눈 만큼 돎 */
	useAnimatedReaction(
		() => scrollY.get(),
		(y, previousY) => {
			if (reducedMotion || previousY === null) {
				return;
			}

			angle.set(angle.get() + (((y - previousY) * direction) / radius.get()) * DEGREES_PER_RADIAN);
		},
	);

	const spinWhilePlaying = useFrameCallback((frame) => {
		const tapeDistance = (frame.timeSincePreviousFrame ?? 0) * PLAYING_TAPE_SPEED;

		angle.set(angle.get() + ((tapeDistance * direction) / radius.get()) * DEGREES_PER_RADIAN);
	}, false);

	/** 재생 중에는 계속 돎 */
	useEffect(() => {
		spinWhilePlaying.setActive(playing && !reducedMotion);
	}, [playing, reducedMotion, spinWhilePlaying]);

	return (
		<View style={{ width: size, height }}>
			<Svg width={size} height={height} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}>
				<Circle cx={CENTER} cy={CENTER + 5} r="40" fill={REEL_COLORS.shade} />
				<Circle
					cx={CENTER}
					cy={CENTER}
					r="40"
					fill={REEL_COLORS.plate}
					stroke={REEL_COLORS.rim}
					strokeWidth={1.5}
				/>
				<Path
					d="M16 31 A29 29 0 0 1 31 16"
					stroke={REEL_COLORS.gleam}
					strokeWidth={5}
					strokeLinecap="round"
					fill="none"
				/>
			</Svg>

			{/*재생하면 도는 부분*/}
			<Animated.View style={[styles.spinner, { width: size, height: size }, spinStyle]}>
				<Svg width={size} height={size} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_WIDTH}`}>
					<AnimatedCircle cx={CENTER} cy={CENTER} fill={colors.text} animatedProps={tapeProps} />
					<AnimatedCircle
						cx={CENTER}
						cy={CENTER}
						fill="none"
						stroke={REEL_COLORS.ring}
						strokeWidth={1.2}
						animatedProps={innerRingProps}
					/>
					<AnimatedCircle
						cx={CENTER}
						cy={CENTER}
						fill="none"
						stroke={REEL_COLORS.ring}
						strokeWidth={1.2}
						animatedProps={outerRingProps}
					/>
					<AnimatedRect
						x="41.5"
						width="3"
						height="6"
						rx="1.5"
						fill={REEL_COLORS.mark}
						animatedProps={markProps}
					/>
					<Circle
						cx={CENTER}
						cy={CENTER}
						r={HUB_RADIUS}
						fill={REEL_COLORS.hub}
						stroke={REEL_COLORS.rim}
						strokeWidth={1.5}
					/>
					{SPOKE_ANGLES.map((spokeAngle) => (
						<Rect
							key={spokeAngle}
							x="41"
							y="31"
							width="4"
							height="8"
							rx="2"
							fill={REEL_COLORS.spoke}
							transform={`rotate(${spokeAngle} ${CENTER} ${CENTER})`}
						/>
					))}
					<Circle cx={CENTER} cy={CENTER} r="3.5" fill={REEL_COLORS.spoke} />
				</Svg>
			</Animated.View>
		</View>
	);
};

const styles = StyleSheet.create({
	spinner: { position: 'absolute', top: 0, left: 0 },
});

export default TapeReel;
