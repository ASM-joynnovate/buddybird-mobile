import { useEffect } from 'react';

import { StyleSheet, View } from 'react-native';

import type { PullEdge, PullStatus } from '@/types/pull-to-refresh';

import useRefreshMessage from '@/hooks/use-refresh-message';

import Animated, {
	Easing,
	type SharedValue,
	useAnimatedStyle,
	useDerivedValue,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withSequence,
	withSpring,
	withTiming,
} from 'react-native-reanimated';

import { colors, radius } from '@/theme';

import BuddyRefreshMessage, { MESSAGE_SPACE } from '@/components/buddy-refresh/message';
import { HOLD_SCENE_HEIGHT } from '@/components/buddy-refresh/options';
import MascotArtwork, { MASCOT_FEET_RATIO } from '@/components/mascot/mascot-artwork';

const MASCOT_SIZE = 80;
const MASCOT_FOOT_Y = MASCOT_SIZE * MASCOT_FEET_RATIO;
const PERCH_WIDTH = 84;
const PERCH_HEIGHT = 8;
const CORD_INSET = 5;
const CORD_ABOVE = 20;
const CORD_BASE_LENGTH = 100;
const FEET_ON_PERCH = 5;
const FINISH_DROP = 20;

const SWING_ANGLE = 14;
const SWING_HALF_MS = 650;
const LEAN_RATIO = 0.5;
const PUMP_WING_ANGLE = 34;
const FLAP_ANGLE = 48;
const FLAP_MS = 170;

const swingEasing = Easing.inOut(Easing.sin);
const stopSpring = { stiffness: 100, damping: 12 };

interface Props {
	edge: PullEdge;
	status: PullStatus;
	distance: SharedValue<number>;
}

/**
 * 그네를 타는 버디 새로고침 표시 컴포넌트
 * @param edge 새로고침 표시 위치
 * @param status 당기기 상태
 * @param distance 새로고침 표시 영역의 높이
 */
const SwingRefreshIndicator = ({ edge, status, distance }: Props) => {
	const reducedMotion = useReducedMotion();

	const swingAngle = useSharedValue(0);
	const flapAngle = useSharedValue(0);
	const eyesHappy = useSharedValue(0);

	const { message, messageShown } = useRefreshMessage(status);

	const refreshFinished = status === 'finishing' || status === 'closing';

	// 그네가 뒤로 갈 때 날개 각도 증가
	const wingAngle = useDerivedValue(() =>
		Math.max(flapAngle.get(), PUMP_WING_ANGLE * Math.max(0, -swingAngle.get() / SWING_ANGLE) ** 3),
	);

	const perchTop = useDerivedValue(() => {
		const sceneBottom = edge === 'top' ? distance.get() - MESSAGE_SPACE * messageShown.get() : HOLD_SCENE_HEIGHT;

		// 새로고침이 끝나면 정해진 만큼만 하강
		return (refreshFinished ? Math.min(sceneBottom, HOLD_SCENE_HEIGHT + FINISH_DROP) : sceneBottom) - PERCH_HEIGHT;
	});

	const swingStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${swingAngle.get()}deg` }] }));
	const cordStyle = useAnimatedStyle(() => ({
		transform: [{ scaleY: (CORD_ABOVE + perchTop.get() + PERCH_HEIGHT / 2) / CORD_BASE_LENGTH }],
	}));
	const seatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: CORD_ABOVE + perchTop.get() }] }));
	const mascotStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${-LEAN_RATIO * swingAngle.get()}deg` }],
	}));

	/** 당기기 상태에 따라 그네 애니메이션 실행 */
	useEffect(() => {
		eyesHappy.set(status === 'finishing' ? 1 : 0);

		if (reducedMotion) {
			return;
		}

		if (status === 'armed') {
			flapAngle.set(
				withSequence(withTiming(FLAP_ANGLE, { duration: FLAP_MS }), withTiming(0, { duration: FLAP_MS })),
			);
		}

		if (status === 'refreshing') {
			swingAngle.set(
				withSequence(
					withTiming(SWING_ANGLE, { duration: SWING_HALF_MS / 2, easing: swingEasing }),
					withRepeat(
						withSequence(
							withTiming(-SWING_ANGLE, { duration: SWING_HALF_MS, easing: swingEasing }),
							withTiming(SWING_ANGLE, { duration: SWING_HALF_MS, easing: swingEasing }),
						),
						-1,
					),
				),
			);
		}

		if (status === 'finishing') {
			swingAngle.set(withSpring(0, stopSpring));
		}
	}, [eyesHappy, flapAngle, reducedMotion, status, swingAngle]);

	return (
		<>
			<Animated.View style={[styles.swing, swingStyle]}>
				<Animated.View style={[styles.cord, styles.leftCord, cordStyle]} />
				<Animated.View style={[styles.cord, styles.rightCord, cordStyle]} />

				<Animated.View style={[styles.seat, seatStyle]}>
					<View style={styles.perch} />

					<Animated.View style={[styles.mascot, mascotStyle]}>
						<MascotArtwork wingAngle={wingAngle} eyesHappy={eyesHappy} />
					</Animated.View>
				</Animated.View>
			</Animated.View>

			<BuddyRefreshMessage message={message} messageShown={messageShown} distance={distance} />
		</>
	);
};

const styles = StyleSheet.create({
	swing: {
		position: 'absolute',
		top: -CORD_ABOVE,
		left: '50%',
		width: PERCH_WIDTH,
		marginLeft: -PERCH_WIDTH / 2,
		transformOrigin: 'top',
	},
	cord: {
		position: 'absolute',
		top: 0,
		width: 2,
		height: CORD_BASE_LENGTH,
		borderRadius: 1,
		backgroundColor: colors.text,
		transformOrigin: 'top',
	},
	leftCord: { left: CORD_INSET },
	rightCord: { right: CORD_INSET },
	seat: { position: 'absolute', top: 0, right: 0, left: 0 },
	perch: {
		position: 'absolute',
		top: 0,
		right: 0,
		left: 0,
		height: PERCH_HEIGHT,
		borderRadius: radius.xsmall,
		backgroundColor: colors.text,
	},
	mascot: {
		position: 'absolute',
		top: FEET_ON_PERCH - MASCOT_FOOT_Y,
		left: (PERCH_WIDTH - MASCOT_SIZE) / 2,
		width: MASCOT_SIZE,
		height: MASCOT_SIZE,
		transformOrigin: [MASCOT_SIZE / 2, MASCOT_FOOT_Y, 0],
	},
});

export default SwingRefreshIndicator;
