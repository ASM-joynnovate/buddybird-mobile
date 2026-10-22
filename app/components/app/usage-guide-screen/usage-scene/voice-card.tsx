import { useEffect } from 'react';

import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import Animated, {
	cancelAnimation,
	Easing,
	type SharedValue,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, G, Path } from 'react-native-svg';

import { SECOND } from '@/config/units';
import { colors, font } from '@/theme';

import { popIn } from '@/components/scene-animations';
import { Copy } from '@/components/ui/copy';

const CARD_WIDTH = 196;
const AVATAR_SIZE = 26;
const WAVE_HEIGHT = 30;
const WAVE_BAR_COUNT = 18;
const WAVE_MS = 1.1 * SECOND;
const WAVE_MIN_LEVEL = 0.18;
const STILL_LEVELS = [0.35, 0.7, 0.45, 0.9, 0.55, 1, 0.6, 0.4, 0.8, 0.5, 0.95, 0.55, 0.85, 0.45, 0.7, 0.35, 0.6, 0.3];
const RECORDING_LENGTH = '0:03';

interface WaveBarProps {
	index: number;
	progress: SharedValue<number>;
	animated: boolean;
}

/**
 * 녹음 소리에 맞춰 높이가 바뀌는 파형 막대 컴포넌트
 * @param index 막대 순서
 * @param progress 파형 움직임 진행도
 * @param animated 움직임 실행 여부
 */
const WaveBar = ({ index, progress, animated }: WaveBarProps) => {
	const phase = ((index * 37) % 11) / 11;

	const barStyle = useAnimatedStyle(() => {
		if (!animated) {
			return { transform: [{ scaleY: STILL_LEVELS[index] }] };
		}

		const wave = 0.5 - 0.5 * Math.cos(2 * Math.PI * (progress.get() + phase));

		return { transform: [{ scaleY: WAVE_MIN_LEVEL + (1 - WAVE_MIN_LEVEL) * wave }] };
	});

	return <Animated.View style={[styles.waveBar, barStyle]} />;
};

/** 보호자 얼굴 자리를 채우는 사람 모양 아바타 컴포넌트 */
const VoiceAvatar = () => {
	return (
		<Svg width={AVATAR_SIZE} height={AVATAR_SIZE} viewBox="0 0 40 40">
			<Defs>
				<ClipPath id="voice-avatar">
					<Circle cx="20" cy="20" r="20" />
				</ClipPath>
			</Defs>
			<Circle cx="20" cy="20" r="20" fill={colors.orangePale} />
			<G clipPath="url(#voice-avatar)" fill={colors.text}>
				<Circle cx="20" cy="16" r="8" />
				<Path d="M4 42c0-10 7-16 16-16s16 6 16 16Z" />
			</G>
			<Circle cx="20" cy="20" r="19" fill="none" stroke={colors.orange} strokeWidth={2} />
		</Svg>
	);
};

interface Props {
	left: number;
	top: number;
	animated: boolean;
	onLayout: (event: LayoutChangeEvent) => void;
}

/**
 * 보호자 목소리로 녹음한 단어 카드 컴포넌트
 * @param left 카드 왼쪽 위치
 * @param top 카드 위쪽 위치
 * @param animated 파형 움직임 실행 여부
 * @param onLayout 카드 크기가 정해질 때 실행할 함수
 */
const UsageVoiceCard = ({ left, top, animated, onLayout }: Props) => {
	const { t } = useTranslation();

	const waveProgress = useSharedValue(0);

	const words = t('onboarding.login.words', { returnObjects: true });

	/** 움직임이 켜져 있으면 파형이 반복해서 출렁임 */
	useEffect(() => {
		if (!animated) {
			return;
		}

		waveProgress.set(withRepeat(withTiming(1, { duration: WAVE_MS, easing: Easing.linear }), -1));

		return () => cancelAnimation(waveProgress);
	}, [animated, waveProgress]);

	return (
		<Animated.View entering={popIn(1)} onLayout={onLayout} style={[styles.edge, { left, top }]}>
			<View style={styles.card}>
				<View style={styles.head}>
					<VoiceAvatar />
					<Copy numberOfLines={1} style={styles.headText}>
						{t('onboarding.usage.record.voiceOwner')}
					</Copy>
					<Copy style={[styles.headText, styles.length]}>{RECORDING_LENGTH}</Copy>
				</View>

				<Copy numberOfLines={1} adjustsFontSizeToFit style={styles.word}>
					{words[0]}
				</Copy>

				<View style={styles.wave}>
					{Array.from({ length: WAVE_BAR_COUNT }, (_, index) => (
						<WaveBar key={index} index={index} progress={waveProgress} animated={animated} />
					))}
				</View>
			</View>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	edge: {
		position: 'absolute',
		width: CARD_WIDTH,
		paddingBottom: 5,
		borderRadius: 20,
		borderCurve: 'continuous',
		backgroundColor: colors.orangeDark,
	},
	card: {
		paddingTop: 12,
		paddingHorizontal: 14,
		paddingBottom: 14,
		borderRadius: 20,
		borderCurve: 'continuous',
		backgroundColor: colors.orange,
	},
	head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	headText: { flexShrink: 1, fontFamily: font.extraBold, fontSize: 13, lineHeight: 16, color: colors.orangePale },
	length: { flexShrink: 0, marginLeft: 'auto', fontVariant: ['tabular-nums'] },
	word: {
		marginTop: 10,
		fontFamily: font.black,
		fontSize: 52,
		lineHeight: 58,
		letterSpacing: -1,
		color: colors.onFilled,
	},
	wave: { height: WAVE_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 },
	waveBar: { width: 4, height: WAVE_HEIGHT, borderRadius: 2, backgroundColor: colors.onFilled },
});

export default UsageVoiceCard;
