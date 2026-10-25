import { useEffect } from 'react';

import { StyleSheet, View } from 'react-native';

import { MicIcon } from 'lucide-react-native';
import Animated, {
	cancelAnimation,
	Easing,
	Extrapolation,
	interpolate,
	Keyframe,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { SECOND } from '@/config/units';
import RecordingSceneDistanceSoundWave, {
	SOUND_WAVE_WIDTH,
	SOUND_WAVE_HEIGHT,
} from '@/screens/words/components/recording-scene/distance/sound-wave';
import RecordingSceneDistanceWaveformBar from '@/screens/words/components/recording-scene/distance/waveform-bar';
import RecordingSceneRecordingDot from '@/screens/words/components/recording-scene/recording-dot';
import { colors, radius } from '@/theme';

import { popIn } from '@/components/scene-animations';

const PERSON_WIDTH = 150;
const PERSON_HEIGHT = 200;
const PERSON_COLORS = {
	skin: '#FFD9B8',
	shade: '#F2B98F',
	hair: '#4a3a33',
	hairShine: '#6b5248',
	blush: '#FFAE95',
	mouth: '#6b2f2a',
};
const PHONE_TILT = '40deg';

/** 휴대폰을 입 쪽으로 기울이는 애니메이션 */
const bringToMouth = () => {
	return new Keyframe({
		0: { transform: [{ translateX: 70 }, { translateY: 20 }, { rotate: '-4deg' }] },
		100: {
			transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: PHONE_TILT }],
			easing: Easing.out(Easing.back(1.25)),
		},
	})
		.duration(900)
		.delay(250);
};

interface Props {
	scale: number;
	animated: boolean;
}

/**
 * 마이크를 입 가까이 대는 장면 컴포넌트
 * @param scale 그림 배율
 * @param animated 녹음 애니메이션 실행 여부
 */
const RecordingSceneDistance = ({ scale, animated }: Props) => {
	const cycleProgress = useSharedValue(0);

	const micBadgeStyle = useAnimatedStyle(() => {
		if (!animated) {
			return { transform: [{ scale: 1 }] };
		}

		return {
			transform: [
				{ scale: interpolate(cycleProgress.get(), [0.2, 0.27, 0.36], [1, 1.18, 1], Extrapolation.CLAMP) },
			],
		};
	});
	const micRingStyle = useAnimatedStyle(() => {
		if (!animated) {
			return { opacity: 0 };
		}

		const range = [0.22, 0.26, 0.5];

		return {
			opacity: interpolate(cycleProgress.get(), range, [0, 0.9, 0], Extrapolation.CLAMP),
			transform: [{ scale: interpolate(cycleProgress.get(), range, [0.6, 0.9, 1.7], Extrapolation.CLAMP) }],
		};
	});

	/** 애니메이션이 켜져 있으면 녹음 장면 반복 */
	useEffect(() => {
		if (!animated) {
			return;
		}

		cycleProgress.set(0);
		cycleProgress.set(
			withDelay(1.2 * SECOND, withRepeat(withTiming(1, { duration: 2.4 * SECOND, easing: Easing.linear }), -1)),
		);

		return () => cancelAnimation(cycleProgress);
	}, [animated, cycleProgress]);

	return (
		<>
			{/*옆을 보는 사람*/}
			<Animated.View entering={popIn(0)} style={[styles.sceneItem, { left: 14 * scale, bottom: 0 }]}>
				<Svg
					width={PERSON_WIDTH * scale}
					height={PERSON_HEIGHT * scale}
					viewBox={`0 0 ${PERSON_WIDTH} ${PERSON_HEIGHT}`}
				>
					<Path d="M18 200C18 168 40 152 76 152S134 168 134 200Z" fill={colors.background} />
					<Path d="M60 124h30v34c-6 4-24 4-30 0Z" fill={PERSON_COLORS.shade} />
					<Circle cx={80} cy={84} r={52} fill={PERSON_COLORS.skin} />
					<Path d="M130 82c5 2 5 9 0 11" fill={PERSON_COLORS.skin} />
					<Path
						d="M29 106C22 86 22 60 36 46 50 28 74 24 94 28 114 32 128 44 132 60 122 56 112 54 104 58 98 50 88 50 80 56 70 62 64 70 60 82 56 92 50 98 44 108 38 110 32 110 29 106Z"
						fill={PERSON_COLORS.hair}
					/>
					<Path
						d="M54 40C66 33 80 31 92 33"
						fill="none"
						stroke={PERSON_COLORS.hairShine}
						strokeWidth={4}
						strokeLinecap="round"
					/>
					<Circle cx={58} cy={94} r={10} fill={PERSON_COLORS.skin} />
					<Circle cx={58} cy={94} r={5} fill={PERSON_COLORS.shade} />
					<Ellipse cx={106} cy={80} rx={4.5} ry={6} fill={colors.text} />
					<Ellipse cx={96} cy={100} rx={9} ry={5.5} fill={PERSON_COLORS.blush} opacity={0.7} />
					<Path
						d="M110 106c2 5 9 6 13 1"
						fill="none"
						stroke={PERSON_COLORS.mouth}
						strokeWidth={3.5}
						strokeLinecap="round"
					/>
				</Svg>
			</Animated.View>

			{/*입에서 마이크로 퍼지는 소리*/}
			<View
				style={[
					styles.sceneItem,
					{
						left: 138 * scale,
						bottom: 58 * scale,
						width: SOUND_WAVE_WIDTH * scale,
						height: SOUND_WAVE_HEIGHT * scale,
					},
				]}
			>
				{Array.from({ length: 3 }, (_, index) => (
					<RecordingSceneDistanceSoundWave
						key={index}
						index={index}
						scale={scale}
						animated={animated}
						cycleProgress={cycleProgress}
					/>
				))}
			</View>

			{/*아래쪽 끝을 입 쪽으로 기울인 휴대폰*/}
			<Animated.View
				entering={bringToMouth()}
				style={[
					styles.sceneItem,
					styles.phone,
					{
						left: 202 * scale,
						bottom: 63 * scale,
						width: 96 * scale,
						height: 176 * scale,
						paddingTop: 7 * scale,
						paddingHorizontal: 7 * scale,
						paddingBottom: 18 * scale,
						borderRadius: 22 * scale,
					},
				]}
			>
				<View style={[styles.phoneScreen, { gap: 10 * scale, borderRadius: 15 * scale }]}>
					<RecordingSceneRecordingDot size={9 * scale} animated={animated} />

					<View style={[styles.waveform, { height: 40 * scale, gap: 3 * scale }]}>
						{[0.35, 0.6, 0.9, 0.55, 1, 0.7, 0.45, 0.85, 0.6, 0.95, 0.5, 0.3].map((level, index) => (
							<RecordingSceneDistanceWaveformBar
								key={index}
								index={index}
								level={level}
								scale={scale}
								animated={animated}
								cycleProgress={cycleProgress}
							/>
						))}
					</View>
				</View>

				{/*아래쪽 끝의 마이크*/}
				<Animated.View
					style={[
						styles.micMark,
						styles.micRing,
						{ bottom: -20 * scale, width: 40 * scale, height: 40 * scale, marginLeft: -20 * scale },
						micRingStyle,
					]}
				/>
				<Animated.View
					style={[
						styles.micMark,
						styles.micBadge,
						{ bottom: -20 * scale, width: 40 * scale, height: 40 * scale, marginLeft: -20 * scale },
						micBadgeStyle,
					]}
				>
					<View style={styles.micIcon}>
						<MicIcon size={18 * scale} color={colors.onFilled} />
					</View>
				</Animated.View>
			</Animated.View>
		</>
	);
};

const styles = StyleSheet.create({
	sceneItem: { position: 'absolute' },
	phone: { borderCurve: 'continuous', transform: [{ rotate: PHONE_TILT }], backgroundColor: colors.background },
	phoneScreen: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		borderCurve: 'continuous',
		backgroundColor: colors.orangePale,
	},
	waveform: { flexDirection: 'row', alignItems: 'center' },
	micMark: {
		position: 'absolute',
		left: '50%',
		borderWidth: 3,
		borderColor: colors.background,
		borderRadius: radius.pill,
	},
	micRing: { opacity: 0 },
	micBadge: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.orangeDark },
	micIcon: { transform: [{ rotate: '-40deg' }] },
});

export default RecordingSceneDistance;
