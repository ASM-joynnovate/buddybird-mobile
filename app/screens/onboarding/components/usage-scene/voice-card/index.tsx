import { useEffect } from 'react';

import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import Animated, { cancelAnimation, Easing, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { SECOND } from '@/config/units';
import UsageSceneVoiceCardAvatar from '@/screens/onboarding/components/usage-scene/voice-card/avatar';
import UsageSceneVoiceCardWaveBar from '@/screens/onboarding/components/usage-scene/voice-card/wave-bar';
import { colors, font } from '@/theme';

import { popIn } from '@/components/scene-animations';
import { Copy } from '@/components/ui/copy';

interface Props {
	left: number;
	top: number;
	animated: boolean;
	onLayout: (event: LayoutChangeEvent) => void;
}

/**
 * 녹음한 단어 카드 컴포넌트
 * @param left 카드 왼쪽 위치
 * @param top 카드 위쪽 위치
 * @param animated 파형 애니메이션 실행 여부
 * @param onLayout 카드 크기가 정해지면 실행할 함수
 */
const UsageSceneVoiceCard = ({ left, top, animated, onLayout }: Props) => {
	const { t } = useTranslation();

	const waveProgress = useSharedValue(0);

	const words = t('onboarding.login.words', { returnObjects: true });

	/** 파형 애니메이션 반복 */
	useEffect(() => {
		if (!animated) {
			return;
		}

		waveProgress.set(withRepeat(withTiming(1, { duration: 1.1 * SECOND, easing: Easing.linear }), -1));

		return () => cancelAnimation(waveProgress);
	}, [animated, waveProgress]);

	return (
		<Animated.View entering={popIn(1)} onLayout={onLayout} style={[styles.edge, { left, top }]}>
			<View style={styles.card}>
				<View style={styles.head}>
					<UsageSceneVoiceCardAvatar />
					<Copy numberOfLines={1} style={styles.headText}>
						{t('onboarding.usage.record.voiceOwner')}
					</Copy>
					<Copy style={[styles.headText, styles.length]}>0:03</Copy>
				</View>

				<Copy numberOfLines={1} adjustsFontSizeToFit style={styles.word}>
					{words[0]}
				</Copy>

				<View style={styles.wave}>
					{Array.from({ length: 18 }, (_, index) => (
						<UsageSceneVoiceCardWaveBar
							key={index}
							index={index}
							progress={waveProgress}
							animated={animated}
						/>
					))}
				</View>
			</View>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	edge: {
		position: 'absolute',
		width: 196,
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
	wave: { height: 30, flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 },
});

export default UsageSceneVoiceCard;
