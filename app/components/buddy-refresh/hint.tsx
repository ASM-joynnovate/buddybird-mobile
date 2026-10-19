import { useEffect, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react-native';
import Animated, {
	cancelAnimation,
	Easing,
	useAnimatedStyle,
	useDerivedValue,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { SECOND } from '@/config/units';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font, radius } from '@/theme';

import MascotArtwork, { MASCOT_FEET_RATIO } from '@/components/mascot/mascot-artwork';
import { Copy } from '@/components/ui/copy';

const MASCOT_SIZE = 80;
const MASCOT_FOOT_Y = MASCOT_SIZE * MASCOT_FEET_RATIO;
const CORD_ABOVE = 60;
const CORD_INSET = 22;
const SIGN_TOP = 62;
const SIGN_HEIGHT = 44;
const HINT_HEIGHT = SIGN_TOP + SIGN_HEIGHT + 4;
const DROP_DISTANCE = 160;

const STAY_SECONDS = 2.9;
const LEAVE_SECONDS = 0.4;
const END_SECONDS = STAY_SECONDS + LEAVE_SECONDS;
const PUSH_SECONDS = 0.35;
const SWAY_START = 0.12;
const SWAY_ANGLE = 6;
const LEAN_RATIO = 0.6;
const FLAP_ANGLE = 42;
const LEAVE_FLAP_ANGLE = 30;
const FLAP_SECONDS = 0.4;
const LAND_FLAP_START = 0.18;
const HAPPY_START = 1.2;
const HAPPY_END = 2;

const ARROW_SHIFT = 2;
const ARROW_MS = 450;

const easeOut = Easing.out(Easing.cubic);
const easeIn = Easing.in(Easing.cubic);

/** 낙하 바운스 진행률을 계산하는 함수 */
const drop = (seconds: number) => {
	'worklet';

	return seconds <= 0 ? 0 : 1 - Math.exp(-8 * seconds) * Math.cos(12 * seconds);
};

/** 날개 각도 비율을 계산하는 함수 */
const flap = (seconds: number, start: number) => {
	'worklet';

	return seconds > start && seconds < start + FLAP_SECONDS
		? Math.sin((Math.PI * (seconds - start)) / FLAP_SECONDS)
		: 0;
};

interface Props {
	mascotShown: boolean;
}

/**
 * 당겨서 새로고침 안내 컴포넌트
 * @param mascotShown 버디와 줄을 표시할지 여부
 */
const BuddyRefreshHint = ({ mascotShown }: Props) => {
	const { t } = useTranslation();

	const reducedMotion = useReducedMotion();

	const pullToRefreshUsed = useDeviceSettingsStore((state) => state.pullToRefreshUsed);

	// 사용 이력이 있으면 표시하지 않음
	const [playing, setPlaying] = useState(!pullToRefreshUsed);

	const elapsed = useSharedValue(0);
	const arrowShift = useSharedValue(0);

	const wingAngle = useDerivedValue(() =>
		reducedMotion
			? 0
			: FLAP_ANGLE * flap(elapsed.get(), LAND_FLAP_START) +
				LEAVE_FLAP_ANGLE * flap(elapsed.get(), STAY_SECONDS - FLAP_SECONDS / 4),
	);
	const eyesHappy = useDerivedValue<number>(() => (elapsed.get() > HAPPY_START && elapsed.get() < HAPPY_END ? 1 : 0));
	const swayAngle = useDerivedValue(() => {
		const seconds = elapsed.get() - SWAY_START;

		if (reducedMotion || !mascotShown || seconds <= 0 || elapsed.get() >= STAY_SECONDS) {
			return 0;
		}

		return SWAY_ANGLE * Math.exp(-3 * seconds) * Math.sin(10 * seconds);
	});

	// 안내 높이만큼 콘텐츠 위치 이동
	const containerStyle = useAnimatedStyle(() => {
		const seconds = elapsed.get();
		const shown =
			seconds < STAY_SECONDS
				? easeOut(Math.min(seconds / PUSH_SECONDS, 1))
				: 1 - easeIn(Math.min((seconds - STAY_SECONDS) / LEAVE_SECONDS, 1));

		return { height: HINT_HEIGHT * (reducedMotion ? Number(seconds < END_SECONDS) : shown) };
	});
	const signStyle = useAnimatedStyle(() => {
		const seconds = elapsed.get();
		const hidden =
			seconds < STAY_SECONDS ? 1 - drop(seconds) : easeIn(Math.min((seconds - STAY_SECONDS) / LEAVE_SECONDS, 1));

		return {
			transform: [
				{ translateY: reducedMotion ? 0 : -hidden * DROP_DISTANCE },
				{ rotate: `${swayAngle.get()}deg` },
			],
		};
	});
	const mascotStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${-swayAngle.get() * LEAN_RATIO}deg` }],
	}));
	const upArrowStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -arrowShift.get() }] }));
	const downArrowStyle = useAnimatedStyle(() => ({ transform: [{ translateY: arrowShift.get() }] }));

	/** 화면에 처음 들어올 때 안내 애니메이션 실행 */
	useEffect(() => {
		if (!playing) {
			return;
		}

		elapsed.set(
			withTiming(END_SECONDS, { duration: END_SECONDS * SECOND, easing: Easing.linear }, (finished) => {
				if (finished) {
					cancelAnimation(arrowShift);
					scheduleOnRN(setPlaying, false);
				}
			}),
		);

		if (!reducedMotion) {
			arrowShift.set(
				withRepeat(
					withSequence(
						withTiming(ARROW_SHIFT, { duration: ARROW_MS }),
						withTiming(0, { duration: ARROW_MS }),
					),
					-1,
				),
			);
		}

		return () => {
			cancelAnimation(elapsed);
			cancelAnimation(arrowShift);
		};
	}, [arrowShift, elapsed, playing, reducedMotion]);

	// 안내가 끝나면 렌더링하지 않음
	if (!playing) {
		return null;
	}

	return (
		<Animated.View pointerEvents="none" style={[styles.container, containerStyle]}>
			<Animated.View style={[styles.signContainer, signStyle]}>
				<View style={styles.cords}>
					{mascotShown && (
						<>
							<View style={[styles.cord, styles.leftCord]} />
							<View style={[styles.cord, styles.rightCord]} />
						</>
					)}
				</View>

				<View style={styles.sign}>
					<View style={styles.arrows}>
						<Animated.View style={upArrowStyle}>
							<ChevronUpIcon size={16} strokeWidth={3} color={colors.orangeDark} />
						</Animated.View>
						<Animated.View style={[styles.downArrow, downArrowStyle]}>
							<ChevronDownIcon size={16} strokeWidth={3} color={colors.orangeDark} />
						</Animated.View>
					</View>
					<Copy numberOfLines={1} style={styles.text}>
						{t('common.pullToRefresh.hint')}
					</Copy>
				</View>

				{mascotShown && (
					<Animated.View style={[styles.mascot, mascotStyle]}>
						<MascotArtwork wingAngle={wingAngle} eyesHappy={eyesHappy} />
					</Animated.View>
				)}
			</Animated.View>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: { overflow: 'hidden', alignItems: 'center' },
	signContainer: { marginTop: -CORD_ABOVE, transformOrigin: 'top' },
	cords: { height: CORD_ABOVE + SIGN_TOP },
	cord: { position: 'absolute', top: 0, bottom: 0, width: 2, borderRadius: 1, backgroundColor: colors.text },
	leftCord: { left: CORD_INSET },
	rightCord: { right: CORD_INSET },
	sign: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		height: SIGN_HEIGHT,
		paddingRight: 16,
		paddingLeft: 12,
		borderWidth: 2,
		borderColor: colors.border,
		borderRadius: radius.tile,
		borderCurve: 'continuous',
		backgroundColor: colors.background,
	},
	arrows: { alignItems: 'center' },
	downArrow: { marginTop: -8 },
	text: { fontFamily: font.extraBold, fontSize: 14 },
	mascot: {
		position: 'absolute',
		top: CORD_ABOVE + SIGN_TOP + 1 - MASCOT_FOOT_Y,
		alignSelf: 'center',
		width: MASCOT_SIZE,
		height: MASCOT_SIZE,
		transformOrigin: [MASCOT_SIZE / 2, MASCOT_FOOT_Y, 0],
	},
});

export default BuddyRefreshHint;
