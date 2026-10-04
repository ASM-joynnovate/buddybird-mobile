import { useEffect } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { CarIcon, MoonIcon, TvIcon, Volume2Icon } from 'lucide-react-native';
import Animated, {
	cancelAnimation,
	Easing,
	Keyframe,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';

import { SECOND } from '@/config/units';
import { colors, font, radius } from '@/theme';
import { sessionColors } from '@/theme/session-colors';

import { popIn } from '@/components/scene-animations';
import { Copy } from '@/components/ui/copy';

const NOISES = [
	{ icon: TvIcon, left: 28, top: 106, appearOrder: 5, quietDelayMs: 900 },
	{ icon: CarIcon, left: 293, top: 206, appearOrder: 6, quietDelayMs: 1100 },
	{ icon: Volume2Icon, left: 36, top: 286, appearOrder: 7, quietDelayMs: 1300 },
];
const WAVE_LEVELS = [0.4, 0.7, 0.5, 0.9, 0.6, 1, 0.5, 0.8, 0.4, 0.7, 0.6, 0.9, 0.5, 0.7];
const QUIET_OPACITY = 0.35;
const QUIET_SCALE = 0.86;
const STRIKE_MS = 300;
const QUIET_MS = 600;
const BLINK_MS = 0.6 * SECOND;

/**
 * 소음 아이콘에 사선이 그어지는 애니메이션
 * @param delayMs 시작 전 기다리는 시간
 */
const strikeIn = (delayMs: number) => {
	return new Keyframe({
		0: { transform: [{ scaleX: 0 }] },
		100: { transform: [{ scaleX: 1 }], easing: Easing.out(Easing.cubic) },
	})
		.duration(STRIKE_MS)
		.delay(delayMs);
};

/**
 * 소음 아이콘이 흐려지며 작아지는 애니메이션
 * @param delayMs 시작 전 기다리는 시간
 */
const quietDown = (delayMs: number) => {
	return new Keyframe({
		0: { opacity: 1, transform: [{ scale: 1 }] },
		100: { opacity: QUIET_OPACITY, transform: [{ scale: QUIET_SCALE }], easing: Easing.out(Easing.cubic) },
	})
		.duration(QUIET_MS)
		.delay(delayMs + STRIKE_MS);
};

interface Props {
	scale: number;
	animated: boolean;
}

/**
 * 소음이 사라진 어두운 방에서 녹음하는 장면 컴포넌트
 * @param scale 그림 배율
 * @param animated 녹음 표시 깜빡임 실행 여부
 */
const RecordingSceneQuiet = ({ scale, animated }: Props) => {
	const { t } = useTranslation();

	const recordingDotOpacity = useSharedValue(1);

	const recordingDotStyle = useAnimatedStyle(() => ({ opacity: recordingDotOpacity.get() }));

	/** 움직임이 켜져 있으면 녹음 표시가 깜빡임 */
	useEffect(() => {
		if (!animated) {
			return;
		}

		recordingDotOpacity.set(withRepeat(withTiming(0.3, { duration: BLINK_MS }), -1, true));

		return () => cancelAnimation(recordingDotOpacity);
	}, [animated, recordingDotOpacity]);

	return (
		<>
			{/*달*/}
			<Animated.View entering={popIn(1)} style={[styles.sceneItem, { left: 287 * scale, top: 16 * scale }]}>
				<MoonIcon size={44 * scale} color={sessionColors.faint} />
			</Animated.View>

			{/*녹음 중인 휴대폰*/}
			<Animated.View
				entering={popIn(0)}
				style={[
					styles.sceneItem,
					styles.phone,
					{
						left: 117 * scale,
						top: 82 * scale,
						width: 140 * scale,
						height: 254 * scale,
						gap: 14 * scale,
						borderRadius: 28 * scale,
					},
				]}
			>
				<View style={[styles.recordingRow, { gap: 6 * scale }]}>
					<Animated.View
						style={[styles.recordingDot, { width: 8 * scale, height: 8 * scale }, recordingDotStyle]}
					/>
					<Copy style={[styles.recordingText, { fontSize: 13 * scale, lineHeight: 18 * scale }]}>
						{t('words.guide.quiet.recording')}
					</Copy>
				</View>

				<View style={[styles.waveRow, { height: 30 * scale, gap: 3 * scale }]}>
					{WAVE_LEVELS.map((level, index) => (
						<View
							key={index}
							style={[styles.waveBar, { width: 3 * scale, height: Math.max(3, level * 8) * scale }]}
						/>
					))}
				</View>
			</Animated.View>

			{/*사선이 그어지며 흐려지는 소음*/}
			{NOISES.map(({ icon: Icon, left, top, appearOrder, quietDelayMs }) => (
				<Animated.View
					key={left}
					entering={popIn(appearOrder)}
					style={[styles.sceneItem, { left: left * scale, top: top * scale }]}
				>
					<Animated.View
						entering={quietDown(quietDelayMs)}
						style={[styles.noise, { width: 56 * scale, height: 56 * scale }]}
					>
						<Icon size={26 * scale} color={sessionColors.faint} />

						<View style={[styles.strikeContainer, { paddingHorizontal: 8 * scale }]}>
							<Animated.View
								entering={strikeIn(quietDelayMs)}
								style={[styles.strike, { height: 3 * scale }]}
							/>
						</View>
					</Animated.View>
				</Animated.View>
			))}
		</>
	);
};

const styles = StyleSheet.create({
	sceneItem: { position: 'absolute' },
	phone: {
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 3,
		borderColor: sessionColors.edge,
		borderCurve: 'continuous',
		backgroundColor: sessionColors.background,
	},
	recordingRow: { flexDirection: 'row', alignItems: 'center' },
	recordingDot: { borderRadius: radius.pill, backgroundColor: colors.error },
	recordingText: { fontFamily: font.extraBold, color: sessionColors.text },
	waveRow: { flexDirection: 'row', alignItems: 'center' },
	waveBar: { borderRadius: radius.pill, backgroundColor: sessionColors.faint },
	noise: {
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 2,
		borderColor: sessionColors.edge,
		borderRadius: radius.pill,
		opacity: QUIET_OPACITY,
		transform: [{ scale: QUIET_SCALE }],
	},
	strikeContainer: {
		...StyleSheet.absoluteFill,
		justifyContent: 'center',
		transform: [{ rotate: '-40deg' }],
	},
	strike: { borderRadius: radius.pill, transformOrigin: 'left', backgroundColor: sessionColors.faint },
});

export default RecordingSceneQuiet;
