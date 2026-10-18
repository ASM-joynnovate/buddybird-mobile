import { useEffect } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { MicIcon } from 'lucide-react-native';
import Animated, {
	cancelAnimation,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';

import { SECOND } from '@/config/units';
import { colors, font, radius } from '@/theme';

import { popIn } from '@/components/scene-animations';
import { Copy } from '@/components/ui/copy';

const EXAMPLE_WORDS = [
	{ wordIndex: 3, left: 24, top: 8, tilt: -5 },
	{ wordIndex: 1, left: 268, top: 20, tilt: 6 },
	{ wordIndex: 2, left: 140, top: 300, tilt: -4 },
];
const WAVE_LEVELS = [
	0.3, 0.67, 0.4, 0.84, 0.52, 0.95, 0.6, 0.38, 0.77, 0.46, 1, 0.55, 0.88, 0.42, 0.7, 0.33, 0.8, 0.5, 0.64, 0.36,
];
const BLINK_MS = 0.6 * SECOND;

interface Props {
	scale: number;
	animated: boolean;
}

/**
 * 내 목소리로 단어를 녹음하는 장면 컴포넌트
 * @param scale 그림 배율
 * @param animated 녹음 표시 깜빡임 실행 여부
 */
const UsageSceneRecord = ({ scale, animated }: Props) => {
	const { t } = useTranslation();

	const recordingDotOpacity = useSharedValue(1);

	const words = t('onboarding.login.words', { returnObjects: true });
	const voiceShape = { borderRadius: 30 * scale, borderBottomRightRadius: 6 * scale };

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
			{/*예시 단어*/}
			{EXAMPLE_WORDS.map(({ wordIndex, left, top, tilt }, order) => (
				<Animated.View
					key={wordIndex}
					entering={popIn(order + 2)}
					style={[styles.exampleWordContainer, { left: left * scale, top: top * scale }]}
				>
					<View style={[styles.exampleWord, { transform: [{ rotate: `${tilt}deg` }] }]}>
						<Copy style={styles.exampleWordText}>{words[wordIndex]}</Copy>
					</View>
				</Animated.View>
			))}

			{/*녹음 중인 단어와 소리 파형*/}
			<Animated.View
				entering={popIn(1)}
				style={[styles.voiceEdge, voiceShape, { left: 32 * scale, top: 64 * scale, paddingBottom: 8 * scale }]}
			>
				<View
					style={[
						styles.voice,
						voiceShape,
						{ paddingTop: 16 * scale, paddingHorizontal: 30 * scale, paddingBottom: 22 * scale },
					]}
				>
					<View style={styles.recordingRow}>
						<Animated.View style={[styles.recordingDot, recordingDotStyle]} />
						<Copy style={styles.recordingText}>{t('onboarding.usage.record.recording')}</Copy>
					</View>

					<Copy style={[styles.wordText, { fontSize: 72 * scale, lineHeight: 80 * scale }]}>{words[0]}</Copy>

					<View style={[styles.waveRow, { height: 36 * scale, gap: 4 * scale }]}>
						{WAVE_LEVELS.map((level, index) => (
							<View
								key={index}
								style={[styles.waveBar, { width: 5 * scale, height: level * 36 * scale }]}
							/>
						))}
					</View>
				</View>
			</Animated.View>

			{/*마이크*/}
			<Animated.View
				entering={popIn(0)}
				style={[
					styles.micContainer,
					{ left: 277 * scale, top: 236 * scale, width: 88 * scale, height: 88 * scale },
				]}
			>
				<MicIcon size={40 * scale} color={colors.orangeDark} />
			</Animated.View>
		</>
	);
};

const styles = StyleSheet.create({
	exampleWordContainer: { position: 'absolute' },
	exampleWord: {
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: radius.pill,
		backgroundColor: colors.background,
	},
	exampleWordText: { fontFamily: font.black, fontSize: 16, lineHeight: 22, color: colors.orangeDark },
	voiceEdge: { position: 'absolute', borderCurve: 'continuous', backgroundColor: colors.orangeDark },
	voice: { gap: 4, borderCurve: 'continuous', backgroundColor: colors.orange },
	recordingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
	recordingDot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.onFilled },
	recordingText: { fontFamily: font.extraBold, fontSize: 14, lineHeight: 20, color: colors.onFilled },
	wordText: { fontFamily: font.black, color: colors.onFilled },
	waveRow: { flexDirection: 'row', alignItems: 'center' },
	waveBar: { borderRadius: radius.pill, backgroundColor: colors.onFilled },
	micContainer: {
		position: 'absolute',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: radius.pill,
		backgroundColor: colors.background,
	},
});

export default UsageSceneRecord;
