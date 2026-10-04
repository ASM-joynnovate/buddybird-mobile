import { useEffect } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { ChevronUpIcon, MusicIcon } from 'lucide-react-native';
import Animated, {
	cancelAnimation,
	Easing,
	FadeIn,
	interpolate,
	interpolateColor,
	Keyframe,
	useAnimatedProps,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { SECOND } from '@/config/units';
import { colors, font } from '@/theme';

import { popIn } from '@/components/scene-animations';
import { Copy } from '@/components/ui/copy';
import { SpeechBubble } from '@/components/ui/speech-bubble';

const LEVEL_BLOCKS = Array.from({ length: 6 }, (_, index) => {
	const strength = 0.3 + index * 0.14;

	return {
		widthPercent: 40 + index * 12,
		faceColor: interpolateColor(strength, [0, 1], [colors.background, colors.blue]),
		edgeColor: interpolateColor(strength, [0, 1], [colors.background, colors.blueDark]),
		delayMs: 300 + index * 200,
	};
});
const LEVEL_BLOCK_LIGHT_MS = 160;
const ARROW_APPEAR_ORDER = 20;
const WAVE_WIDTH = 210;
const WAVE_HEIGHT = 60;
const WAVE_CYCLES = 6;
const WAVE_AMPLITUDE = 24;
const WAVE_POINTS = Array.from({ length: WAVE_WIDTH / 3 + 1 }, (_, index) => {
	const x = index * 3;
	const progress = x / WAVE_WIDTH;
	const envelope = Math.sin(progress * Math.PI);

	return { x, y: WAVE_HEIGHT / 2 - WAVE_AMPLITUDE * envelope * Math.sin(progress * Math.PI * 2 * WAVE_CYCLES) };
});
const WAVE_PATH = WAVE_POINTS.map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)}`).join(' ');
const WAVE_LENGTH = WAVE_POINTS.slice(1).reduce(
	(length, point, index) => length + Math.hypot(point.x - WAVE_POINTS[index].x, point.y - WAVE_POINTS[index].y),
	0,
);
const WAVE_DRAW_DELAY_MS = 500;
const WAVE_DRAW_MS = 1.6 * SECOND;
const SPEECH_LIFT_DELAY_MS = 200;
const SPEECH_LIFT_MS = 1.4 * SECOND;
const NOTE_RISE_MS = 2.6 * SECOND;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** 말풍선이 아래에서 떠오르는 애니메이션 */
const liftUp = () => {
	return new Keyframe({
		0: { opacity: 0, transform: [{ translateY: 160 }] },
		30: { opacity: 1 },
		100: { opacity: 1, transform: [{ translateY: 0 }], easing: Easing.out(Easing.cubic) },
	})
		.duration(SPEECH_LIFT_MS)
		.delay(SPEECH_LIFT_DELAY_MS);
};

/**
 * 진행률에 맞춰 음표가 떠오르며 사라지는 스타일을 반환하는 함수
 * @param progress 음표 한 번이 떠오르는 진행률
 * @param scale 그림 배율
 */
const risingNoteStyle = (progress: number, scale: number) => {
	'worklet';

	return {
		opacity: interpolate(progress, [0, 0.25, 1], [0, 1, 0]),
		transform: [{ translateY: interpolate(progress, [0, 1], [30, -40]) * scale }],
	};
};

interface Props {
	scale: number;
	animated: boolean;
}

/**
 * 높은 목소리로 또렷하게 말하는 장면 컴포넌트
 * @param scale 그림 배율
 * @param animated 파형과 음표 움직임 실행 여부
 */
const RecordingSceneHighVoice = ({ scale, animated }: Props) => {
	const { t } = useTranslation();

	const waveProgress = useSharedValue(1);
	const noteProgress = useSharedValue(0);

	const waveProps = useAnimatedProps(() => ({ strokeDashoffset: WAVE_LENGTH * (1 - waveProgress.get()) }));
	const firstNoteStyle = useAnimatedStyle(() =>
		animated ? risingNoteStyle(noteProgress.get(), scale) : { opacity: 1 },
	);
	const secondNoteStyle = useAnimatedStyle(() =>
		animated ? risingNoteStyle((noteProgress.get() + 0.5) % 1, scale) : { opacity: 1 },
	);

	/** 움직임이 켜져 있으면 파형을 그리고 음표가 떠오르기를 반복 */
	useEffect(() => {
		if (!animated) {
			return;
		}

		waveProgress.set(0);
		waveProgress.set(
			withDelay(WAVE_DRAW_DELAY_MS, withTiming(1, { duration: WAVE_DRAW_MS, easing: Easing.linear })),
		);

		noteProgress.set(0);
		noteProgress.set(withRepeat(withTiming(1, { duration: NOTE_RISE_MS, easing: Easing.out(Easing.quad) }), -1));

		return () => {
			cancelAnimation(waveProgress);
			cancelAnimation(noteProgress);
		};
	}, [animated, noteProgress, waveProgress]);

	return (
		<>
			{/*아래부터 켜지는 목소리 높이 블록*/}
			<View
				style={[
					styles.sceneItem,
					styles.level,
					{ left: 28 * scale, top: 26 * scale, width: 64 * scale, height: 300 * scale },
				]}
			>
				<Animated.View entering={popIn(ARROW_APPEAR_ORDER)}>
					<ChevronUpIcon size={28 * scale} color={colors.blueDark} strokeWidth={3} />
				</Animated.View>

				<View style={[styles.levelBlocks, { gap: 8 * scale, marginTop: 2 * scale }]}>
					{LEVEL_BLOCKS.map(({ widthPercent, faceColor, edgeColor, delayMs }) => (
						<View key={delayMs} style={[styles.levelBlock, { width: `${widthPercent}%` }]}>
							<View
								style={[
									styles.levelBlockFace,
									styles.levelBlockOff,
									{ borderRadius: 12 * scale, borderBottomWidth: 5 * scale },
								]}
							/>
							<Animated.View
								entering={FadeIn.duration(LEVEL_BLOCK_LIGHT_MS).delay(delayMs)}
								style={[
									styles.levelBlockFace,
									{
										borderRadius: 12 * scale,
										borderBottomWidth: 5 * scale,
										borderColor: faceColor,
										borderBottomColor: edgeColor,
										backgroundColor: faceColor,
									},
								]}
							/>
						</View>
					))}
				</View>
			</View>

			{/*떠오르는 말풍선*/}
			<Animated.View entering={liftUp()} style={[styles.sceneItem, { left: 104 * scale, top: 56 * scale }]}>
				<SpeechBubble pointerSide="left">
					<Copy
						numberOfLines={1}
						adjustsFontSizeToFit
						style={[styles.speechText, { fontSize: 58 * scale, lineHeight: 70 * scale }]}
					>
						{t('words.guide.highVoice.speech')}
					</Copy>
				</SpeechBubble>
			</Animated.View>

			{/*높은 소리 파형*/}
			<Svg
				width={230 * scale}
				height={(230 * WAVE_HEIGHT * scale) / WAVE_WIDTH}
				viewBox={`0 0 ${WAVE_WIDTH} ${WAVE_HEIGHT}`}
				style={[styles.sceneItem, { left: 104 * scale, top: 216 * scale }]}
			>
				<AnimatedPath
					d={WAVE_PATH}
					fill="none"
					stroke={colors.blue}
					strokeWidth={5}
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeDasharray={`${WAVE_LENGTH} ${WAVE_LENGTH}`}
					animatedProps={waveProps}
				/>
			</Svg>

			{/*떠오르는 음표*/}
			<Animated.View style={[styles.sceneItem, { left: 290 * scale, top: 6 * scale }, firstNoteStyle]}>
				<MusicIcon size={28 * scale} color={colors.blue} />
			</Animated.View>
			<Animated.View style={[styles.sceneItem, { left: 320 * scale, top: 46 * scale }, secondNoteStyle]}>
				<MusicIcon size={22 * scale} color={colors.blue} />
			</Animated.View>
		</>
	);
};

const styles = StyleSheet.create({
	sceneItem: { position: 'absolute' },
	level: { alignItems: 'center' },
	levelBlocks: { flex: 1, alignSelf: 'stretch', flexDirection: 'column-reverse', alignItems: 'center' },
	levelBlock: { flex: 1 },
	levelBlockFace: { ...StyleSheet.absoluteFill, borderWidth: 2, borderCurve: 'continuous' },
	levelBlockOff: { borderColor: colors.border, backgroundColor: colors.background },
	speechText: { fontFamily: font.black, color: colors.text },
});

export default RecordingSceneHighVoice;
