import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { type StyleProp, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
	type AnimatedRef,
	type AnimatedStyle,
	Easing,
	type EasingFunctionFactory,
	type SharedValue,
	useAnimatedStyle,
	useFrameCallback,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withSequence,
	withTiming,
} from 'react-native-reanimated';
import { scheduleOnUI } from 'react-native-worklets';

import { SECOND } from '@/config/units';
import { colors } from '@/theme';

import Feather, { createFeatherDrop, type FeatherDrop } from '@/components/app/startup-screen/feather';
import MascotArtwork from '@/components/mascot/mascot-artwork';

const DRAWN_BUDDY_SIZE = 144;
const PERCH_WIDTH = 196;
const ROPE_WIDTH = 6;
const ROPE_INSET = 22;
const ROPE_BOTTOM_GAP = 8;
const BAR_HEIGHT = 24;
const BAR_EDGE = 5;
const MASCOT_FEET_RATIO = 449 / 512;
const PIVOT_ABOVE = 40;
const DEGREES_PER_RADIAN = 180 / Math.PI;

const SWING_PERIOD_SECONDS = 1.5;
const STIFFNESS = ((2 * Math.PI) / SWING_PERIOD_SECONDS) ** 2;
const DAMPING = 1.7;
const MAX_FRAME_SECONDS = 0.05;
const START_ANGLE = 3;
const MAX_ANGLE = 30;
const MIN_DRAG_DEPTH = 80;
const MAX_RELEASE_SPEED = 120;
const LEAN_RATIO = -0.3;

const NUDGE_MS = 3.2 * SECOND;
const NUDGE_KICK = 38;
const LAND_KICK_DELAY_MS = 200;
const LAND_KICK = 70;
const FLY_KICK = 90;

const BUDDY_MOVE_MS = 420;
const LAND_PORTIONS = [0.48, 0.2, 0.16, 0.16];
const LAND_START_SCALE_X = 0.9;
const LAND_START_SCALE_Y = 1.14;
const LAND_Y = [0, -26, 0, 0];
const LAND_SCALE_X = [1.2, 0.94, 1.08, 1];
const LAND_SCALE_Y = [0.72, 1.08, 0.92, 1];
const FLY_PORTIONS = [0.3, 0.7];
const FLY_CROUCH_Y = 12;
const FLY_SCALE_X = [1.2, 0.86];
const FLY_SCALE_Y = [0.74, 1.2];

const DIP_PEAK_PORTION = 0.3;
const LAND_DIP = { depth: 24, delay: 200, duration: 500 };
const FLY_DIP = { depth: -18, delay: 100, duration: 450 };

const FEATHER_COUNT = 6;
const FEATHER_STAGGER_MS = 70;

const landEasing = Easing.bezier(0.4, 0, 1, 1);
const flyEasing = Easing.bezier(0.6, 0, 0.9, 0.4);
const dipEasing = Easing.bezier(0.34, 1.8, 0.64, 1);

/**
 * 구간마다 정한 값으로 차례로 바뀌는 애니메이션을 만드는 함수
 * @param start 시작 값
 * @param values 구간이 끝날 때의 값 목록
 * @param portions 전체 시간에서 각 구간이 차지하는 비율 목록
 * @param easing 구간마다 쓰는 속도 곡선
 */
const keyframes = (
	start: number,
	values: readonly number[],
	portions: readonly number[],
	easing: EasingFunctionFactory,
) => {
	return withSequence(
		withTiming(start, { duration: 0 }),
		...values.map((value, index) =>
			withTiming(value, { duration: (portions[index] ?? 0) * BUDDY_MOVE_MS, easing }),
		),
	);
};

/**
 * 막대가 눌렸다가 튀어 돌아오는 애니메이션을 만드는 함수
 * @param dip 막대가 눌리는 움직임
 */
const dipMotion = ({ depth, delay, duration }: typeof LAND_DIP) => {
	return withDelay(
		delay,
		withSequence(
			withTiming(depth, { duration: duration * DIP_PEAK_PORTION, easing: dipEasing }),
			withTiming(0, { duration: duration * (1 - DIP_PEAK_PORTION), easing: dipEasing }),
		),
	);
};

/** 횃대가 기운 반대쪽으로 힘을 더하는 함수 */
const pushAgainstTilt = (angle: SharedValue<number>, speed: SharedValue<number>, force: number) => {
	'worklet';

	speed.set(speed.get() + (angle.get() >= 0 ? -force : force));
};

/** 끌고 있지 않으면 횃대를 짧게 흔드는 함수 */
const nudgePerch = (speed: SharedValue<number>, dragging: SharedValue<boolean>) => {
	'worklet';

	if (!dragging.get()) {
		speed.set(speed.get() + NUDGE_KICK);
	}
};

/** 손가락 위치에 맞는 횃대 각도를 반환하는 함수 */
const angleAt = (x: number, y: number, pivotX: number) => {
	'worklet';

	const angle = -Math.atan2(x - pivotX, Math.max(y + PIVOT_ABOVE, MIN_DRAG_DEPTH)) * DEGREES_PER_RADIAN;

	return Math.min(MAX_ANGLE, Math.max(-MAX_ANGLE, angle));
};

/** 손을 뗄 때의 손가락 속도를 횃대가 도는 속도로 바꾸는 함수 */
const releaseSpeedOf = (x: number, y: number, velocityX: number, velocityY: number, pivotX: number) => {
	'worklet';

	const dx = x - pivotX;
	const dy = Math.max(y + PIVOT_ABOVE, MIN_DRAG_DEPTH);
	const speed = (-(dy * velocityX - dx * velocityY) / (dx * dx + dy * dy)) * DEGREES_PER_RADIAN;

	return Math.min(MAX_RELEASE_SPEED, Math.max(-MAX_RELEASE_SPEED, speed));
};

interface Props {
	size: number;
	barBottom: number;
	buddySeated: boolean;
	dragEnabled: boolean;
	buddyRef: AnimatedRef<Animated.View>;
	buddyStyle: StyleProp<AnimatedStyle<ViewStyle>>;
	style: StyleProp<AnimatedStyle<ViewStyle>>;
}

/**
 * 화면 위에 매달려 흔들리는 횃대 컴포넌트
 * @param size 버디 크기
 * @param barBottom 화면 위에서 막대 아래까지의 거리
 * @param buddySeated 버디가 횃대에 앉아 있는지 여부
 * @param dragEnabled 손가락으로 끌 수 있는지 여부
 * @param buddyRef 앉은 버디의 화면 위치를 잴 때 쓰는 ref
 * @param buddyStyle 앉은 버디에 더할 스타일
 * @param style 횃대 전체에 더할 스타일
 */
const Perch = ({ size, barBottom, buddySeated, dragEnabled, buddyRef, buddyStyle, style }: Props) => {
	const { width } = useWindowDimensions();

	const reducedMotion = useReducedMotion();

	const scale = size / DRAWN_BUDDY_SIZE;
	const perchWidth = PERCH_WIDTH * scale;
	const ropeLength = barBottom + PIVOT_ABOVE;
	const pivotX = width / 2;

	const angle = useSharedValue(reducedMotion ? 0 : START_ANGLE);
	const speed = useSharedValue(0);
	const dragging = useSharedValue(false);
	const dip = useSharedValue(0);
	const buddyY = useSharedValue(buddySeated ? 0 : -ropeLength);
	const buddyScaleX = useSharedValue(1);
	const buddyScaleY = useSharedValue(1);

	const [featherDrops, setFeatherDrops] = useState<FeatherDrop[]>([]);

	const seatedRef = useRef(buddySeated);
	const featherIdRef = useRef(0);

	const swingStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.get()}deg` }] }));
	const dipStyle = useAnimatedStyle(() => ({ transform: [{ translateY: dip.get() }] }));
	const buddyMoveStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: buddyY.get() }, { scaleX: buddyScaleX.get() }, { scaleY: buddyScaleY.get() }],
	}));
	const leanStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.get() * LEAN_RATIO}deg` }] }));

	const dragGesture = useMemo(
		() =>
			Gesture.Pan()
				.enabled(dragEnabled && !reducedMotion)
				.onBegin((event) => {
					dragging.set(true);
					speed.set(0);
					angle.set(angleAt(event.absoluteX, event.absoluteY, pivotX));
				})
				.onUpdate((event) => {
					angle.set(angleAt(event.absoluteX, event.absoluteY, pivotX));
				})
				.onEnd((event) => {
					speed.set(
						releaseSpeedOf(event.absoluteX, event.absoluteY, event.velocityX, event.velocityY, pivotX),
					);
				})
				.onFinalize(() => {
					dragging.set(false);
				}),
		[angle, dragEnabled, dragging, pivotX, reducedMotion, speed],
	);

	/** 프레임마다 횃대의 흔들림 계산 */
	useFrameCallback(({ timeSincePreviousFrame }) => {
		if (dragging.get()) {
			return;
		}

		const seconds = Math.min((timeSincePreviousFrame ?? 0) / SECOND, MAX_FRAME_SECONDS);
		const nextSpeed = speed.get() + (-STIFFNESS * angle.get() - DAMPING * speed.get()) * seconds;

		speed.set(nextSpeed);
		angle.set(angle.get() + nextSpeed * seconds);
	}, !reducedMotion);

	/** 버디가 없는 동안 일정 간격으로 횃대를 흔듦 */
	useEffect(() => {
		if (buddySeated || reducedMotion) {
			return;
		}

		const timer = setInterval(() => scheduleOnUI(nudgePerch, speed, dragging), NUDGE_MS);

		return () => clearInterval(timer);
	}, [buddySeated, dragging, reducedMotion, speed]);

	/** 버디가 횃대에 내려앉거나 떠날 때 애니메이션 실행 */
	useEffect(() => {
		if (seatedRef.current === buddySeated) {
			return;
		}

		seatedRef.current = buddySeated;

		if (reducedMotion) {
			buddyY.set(buddySeated ? 0 : -ropeLength);

			return;
		}

		if (!buddySeated) {
			const radians = angle.get() / DEGREES_PER_RADIAN;
			const barX = pivotX - Math.sin(radians) * ropeLength;
			const barY = Math.cos(radians) * ropeLength - PIVOT_ABOVE;
			const drops = Array.from({ length: FEATHER_COUNT }, (_, index) =>
				createFeatherDrop(`${featherIdRef.current + index}`, barX, barY, index * FEATHER_STAGGER_MS),
			);

			featherIdRef.current += FEATHER_COUNT;

			buddyY.set(keyframes(0, [FLY_CROUCH_Y, -ropeLength], FLY_PORTIONS, flyEasing));
			buddyScaleX.set(keyframes(1, FLY_SCALE_X, FLY_PORTIONS, flyEasing));
			buddyScaleY.set(keyframes(1, FLY_SCALE_Y, FLY_PORTIONS, flyEasing));
			dip.set(dipMotion(FLY_DIP));
			scheduleOnUI(pushAgainstTilt, angle, speed, -FLY_KICK);

			setFeatherDrops((prev) => [...prev, ...drops]);

			return;
		}

		buddyY.set(keyframes(-ropeLength, LAND_Y, LAND_PORTIONS, landEasing));
		buddyScaleX.set(keyframes(LAND_START_SCALE_X, LAND_SCALE_X, LAND_PORTIONS, landEasing));
		buddyScaleY.set(keyframes(LAND_START_SCALE_Y, LAND_SCALE_Y, LAND_PORTIONS, landEasing));
		dip.set(dipMotion(LAND_DIP));

		const timer = setTimeout(() => scheduleOnUI(pushAgainstTilt, angle, speed, LAND_KICK), LAND_KICK_DELAY_MS);

		return () => clearTimeout(timer);
	}, [angle, buddyScaleX, buddyScaleY, buddySeated, buddyY, dip, pivotX, reducedMotion, ropeLength, speed]);

	const handleFeatherEnd = useCallback((id: string) => {
		setFeatherDrops((prev) => prev.filter((drop) => drop.id !== id));
	}, []);

	return (
		<Animated.View
			pointerEvents="box-none"
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
			style={[StyleSheet.absoluteFill, style]}
		>
			<GestureDetector gesture={dragGesture}>
				<Animated.View
					style={[
						styles.swing,
						{ left: pivotX - perchWidth / 2, width: perchWidth, height: ropeLength },
						swingStyle,
					]}
				>
					<Animated.View style={[StyleSheet.absoluteFill, dipStyle]}>
						{/*줄*/}
						<View
							style={[
								styles.rope,
								{ left: ROPE_INSET * scale, bottom: ROPE_BOTTOM_GAP * scale },
								{ width: ROPE_WIDTH * scale, borderRadius: (ROPE_WIDTH * scale) / 2 },
							]}
						/>
						<View
							style={[
								styles.rope,
								{ right: ROPE_INSET * scale, bottom: ROPE_BOTTOM_GAP * scale },
								{ width: ROPE_WIDTH * scale, borderRadius: (ROPE_WIDTH * scale) / 2 },
							]}
						/>

						{/*막대에 발을 올린 버디*/}
						<Animated.View
							ref={buddyRef}
							style={[
								styles.buddy,
								{
									left: (perchWidth - size) / 2,
									bottom: BAR_HEIGHT * scale - size * (1 - MASCOT_FEET_RATIO),
									width: size,
									height: size,
								},
								buddyMoveStyle,
								buddyStyle,
							]}
						>
							<Animated.View style={[styles.lean, leanStyle]}>
								<MascotArtwork />
							</Animated.View>
						</Animated.View>

						{/*막대*/}
						<View
							style={[
								styles.barEdge,
								{
									bottom: -BAR_EDGE * scale,
									height: (BAR_HEIGHT + BAR_EDGE) * scale,
									borderRadius: (BAR_HEIGHT * scale) / 2,
								},
							]}
						>
							<View
								style={[
									styles.bar,
									{ height: BAR_HEIGHT * scale, borderRadius: (BAR_HEIGHT * scale) / 2 },
								]}
							/>
						</View>
					</Animated.View>
				</Animated.View>
			</GestureDetector>

			{featherDrops.map((drop) => (
				<Feather key={drop.id} drop={drop} onEnd={handleFeatherEnd} />
			))}
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	swing: { position: 'absolute', top: -PIVOT_ABOVE, transformOrigin: '50% 0%' },
	rope: { position: 'absolute', top: 0, backgroundColor: colors.text },
	buddy: { position: 'absolute' },
	lean: { flex: 1, transformOrigin: `50% ${MASCOT_FEET_RATIO * 100}%` },
	barEdge: { position: 'absolute', left: 0, right: 0, backgroundColor: colors.textDark },
	bar: { backgroundColor: colors.text },
});

export default Perch;
