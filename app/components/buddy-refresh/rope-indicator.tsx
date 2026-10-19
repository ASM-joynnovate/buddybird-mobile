import { useEffect } from 'react';

import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import type { PullStatus } from '@/types/pull-to-refresh';

import useRefreshMessage from '@/hooks/use-refresh-message';

import Animated, {
	cancelAnimation,
	Easing,
	type SharedValue,
	useAnimatedProps,
	useAnimatedReaction,
	useAnimatedStyle,
	useDerivedValue,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme';

import BuddyRefreshMessage from '@/components/buddy-refresh/message';
import { HOLD_SCENE_HEIGHT } from '@/components/buddy-refresh/options';
import MascotArtwork, { MASCOT_FEET_RATIO } from '@/components/mascot/mascot-artwork';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const MASCOT_SIZE = 80;
const MASCOT_FOOT_Y = MASCOT_SIZE * MASCOT_FEET_RATIO;

const ROPE_Y = 10;
const ROPE_WIDTH = 2.5;
const KNOT_SIZE = 10;
const FEET_LIFT = 2;
const PULL_GAP = 6;
const MIN_SAG = 6;
const HOLD_SAG = HOLD_SCENE_HEIGHT - ROPE_Y - FEET_LIFT;
const CURVE_EDGE = 20;
const TILT_RATIO = 0.7;

const STEP_DELAY_MS = 500;
const STEP_DISTANCE = 64;
const STEP_MS = 650;
const HOP_HEIGHT = 5;
const HOP_MS = 130;
const HOP_WING_RATIO = 2;
const FLAP_ANGLE = 48;
const FLAP_MS = 170;
const FLUTTER_ANGLE = 56;
const FLUTTER_MS = 55;
const FLY_DISTANCE = 160;
const FLY_MS = 560;

const ropeSpring = { stiffness: 260, damping: 11 };
const stepEasing = Easing.inOut(Easing.sin);

/**
 * 줄 모양을 계산하는 함수
 * @param width 줄을 묶은 두 점 사이의 폭
 * @param sag 줄이 처진 깊이
 * @param x 버디가 선 가로 위치
 */
const getRopeShape = (width: number, sag: number, x: number) => {
	'worklet';

	const left = KNOT_SIZE / 2;
	const right = width - KNOT_SIZE / 2;
	const controlX = Math.min(Math.max(x, left + CURVE_EDGE), right - CURVE_EDGE);
	const controlY = ROPE_Y + 2 * sag;

	// 2차 곡선에서 가로 위치가 x인 지점의 매개변수 계산
	const a = left - 2 * controlX + right;
	const b = 2 * (controlX - left);
	const c = left - x;
	const t = Math.min(Math.max((-2 * c) / (b + Math.sqrt(Math.max(0, b * b - 4 * a * c))), 0), 1);

	const y = ROPE_Y + 2 * t * (1 - t) * (controlY - ROPE_Y);
	const slope =
		(2 * (1 - 2 * t) * (controlY - ROPE_Y)) / (2 * (1 - t) * (controlX - left) + 2 * t * (right - controlX));

	return { path: `M${left} ${ROPE_Y}Q${controlX} ${controlY} ${right} ${ROPE_Y}`, y, slope };
};

interface Props {
	status: PullStatus;
	distance: SharedValue<number>;
}

/**
 * 줄 위의 버디 새로고침 표시 컴포넌트
 * @param status 당기기 상태
 * @param distance 새로고침 표시 영역의 높이
 */
const RopeRefreshIndicator = ({ status, distance }: Props) => {
	const reducedMotion = useReducedMotion();

	const width = useSharedValue(0);
	const ropeSag = useSharedValue(MIN_SAG);
	const stepX = useSharedValue(0);
	const hopY = useSharedValue(0);
	const flight = useSharedValue(0);
	const flapAngle = useSharedValue(0);
	const flutterAngle = useSharedValue(0);
	const eyesHappy = useSharedValue(0);

	const { message, messageShown } = useRefreshMessage(status);

	const followingPull = status === 'pulling' || status === 'armed';

	const rope = useDerivedValue(() => getRopeShape(width.get(), ropeSag.get(), width.get() / 2 + stepX.get()));
	const wingAngle = useDerivedValue(() =>
		Math.max(flapAngle.get(), flutterAngle.get(), -hopY.get() * HOP_WING_RATIO),
	);

	const ropeProps = useAnimatedProps(() => ({ d: rope.get().path }));
	const mascotStyle = useAnimatedStyle(() => {
		const feetY = rope.get().y + FEET_LIFT + hopY.get() - flight.get() * FLY_DISTANCE;
		const tilt = flight.get() > 0 ? 0 : (Math.atan(rope.get().slope) * 180 * TILT_RATIO) / Math.PI;

		return {
			transform: [
				{ translateX: width.get() / 2 + stepX.get() - MASCOT_SIZE / 2 },
				{ translateY: feetY - MASCOT_FOOT_Y },
				{ rotate: `${tilt}deg` },
			],
		};
	});

	/** 당기는 동안 줄 처짐 갱신 */
	useAnimatedReaction(
		() => Math.max(MIN_SAG, distance.get() - ROPE_Y - PULL_GAP),
		(pullSag) => {
			if (followingPull) {
				ropeSag.set(pullSag);
			}
		},
	);

	/** 당기기 상태에 따라 버디 애니메이션 실행 */
	useEffect(() => {
		eyesHappy.set(status === 'finishing' ? 1 : 0);

		if (status === 'refreshing') {
			ropeSag.set(reducedMotion ? HOLD_SAG : withSpring(HOLD_SAG, ropeSpring));
		}

		if (reducedMotion) {
			return;
		}

		if (status === 'armed') {
			flapAngle.set(
				withSequence(withTiming(FLAP_ANGLE, { duration: FLAP_MS }), withTiming(0, { duration: FLAP_MS })),
			);
		}

		if (status === 'refreshing') {
			stepX.set(
				withDelay(
					STEP_DELAY_MS,
					withRepeat(
						withSequence(
							withTiming(STEP_DISTANCE, { duration: STEP_MS, easing: stepEasing }),
							withTiming(-STEP_DISTANCE, { duration: STEP_MS * 2, easing: stepEasing }),
							withTiming(0, { duration: STEP_MS, easing: stepEasing }),
						),
						-1,
					),
				),
			);
			hopY.set(
				withDelay(
					STEP_DELAY_MS,
					withRepeat(
						withSequence(
							withTiming(-HOP_HEIGHT, { duration: HOP_MS }),
							withTiming(0, { duration: HOP_MS }),
						),
						-1,
					),
				),
			);
		}

		if (status === 'finishing') {
			cancelAnimation(stepX);
			cancelAnimation(hopY);
			hopY.set(0);

			ropeSag.set(withSpring(MIN_SAG, ropeSpring));
			flight.set(withTiming(1, { duration: FLY_MS, easing: Easing.in(Easing.quad) }));
			flutterAngle.set(
				withRepeat(
					withSequence(
						withTiming(FLUTTER_ANGLE, { duration: FLUTTER_MS }),
						withTiming(0, { duration: FLUTTER_MS }),
					),
					-1,
				),
			);
		}
	}, [eyesHappy, flapAngle, flight, flutterAngle, hopY, reducedMotion, ropeSag, status, stepX]);

	const handleLayout = (event: LayoutChangeEvent) => {
		width.set(event.nativeEvent.layout.width);
	};

	return (
		<View style={styles.container} onLayout={handleLayout}>
			<Svg style={styles.rope}>
				<AnimatedPath
					animatedProps={ropeProps}
					fill="none"
					stroke={colors.text}
					strokeWidth={ROPE_WIDTH}
					strokeLinecap="round"
				/>
			</Svg>
			<View style={[styles.knot, styles.leftKnot]} />
			<View style={[styles.knot, styles.rightKnot]} />

			<Animated.View style={[styles.mascot, mascotStyle]}>
				<MascotArtwork wingAngle={wingAngle} eyesHappy={eyesHappy} />
			</Animated.View>

			<BuddyRefreshMessage message={message} messageShown={messageShown} distance={distance} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: { ...StyleSheet.absoluteFill },
	rope: { position: 'absolute', top: 0, right: 0, left: 0, height: HOLD_SCENE_HEIGHT + MASCOT_SIZE },
	knot: {
		position: 'absolute',
		top: ROPE_Y - KNOT_SIZE / 2,
		width: KNOT_SIZE,
		height: KNOT_SIZE,
		borderRadius: KNOT_SIZE / 2,
		backgroundColor: colors.text,
	},
	leftKnot: { left: 0 },
	rightKnot: { right: 0 },
	mascot: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: MASCOT_SIZE,
		height: MASCOT_SIZE,
		transformOrigin: [MASCOT_SIZE / 2, MASCOT_FOOT_Y, 0],
	},
});

export default RopeRefreshIndicator;
