import { useEffect, useState } from 'react';

import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useIsFocused } from '@react-navigation/native';
import { MicIcon } from 'lucide-react-native';
import Animated, {
	cancelAnimation,
	Easing,
	Extrapolation,
	interpolate,
	useAnimatedProps,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { SECOND } from '@/config/units';
import PermissionSceneAlert from '@/screens/onboarding/components/permission-scene/alert';
import PermissionSceneWaves from '@/screens/onboarding/components/permission-scene/waves';
import SceneWindow from '@/screens/onboarding/components/scene-window';
import { colors, font, radius } from '@/theme';
import { sessionColors, sessionPhaseColors } from '@/theme/session-colors';

import Mascot from '@/components/mascot';
import SceneStage, { getStageScale, type SceneArea } from '@/components/scene-stage';
import { Copy } from '@/components/ui/copy';

const STAGE_WIDTH = 393;
const STAGE_HEIGHT = 340;
const CYCLE_MS = 6 * SECOND;

const AnimatedRect = Animated.createAnimatedComponent(Rect);

/** 새장 앞 휴대폰이 앵무새 소리를 듣고 알림을 보내는 장면 컴포넌트 */
const PermissionScene = () => {
	const { t } = useTranslation();

	const screenFocused = useIsFocused();

	const reducedMotion = useReducedMotion();

	const cycle = useSharedValue(0);

	const [area, setArea] = useState<SceneArea>({ width: 0, height: 0 });

	const animated = screenFocused && !reducedMotion;
	const scale = getStageScale(area, STAGE_WIDTH, STAGE_HEIGHT);

	const wordStyle = useAnimatedStyle(() => {
		if (reducedMotion) {
			return { opacity: 1 };
		}

		const progress = cycle.get();

		return {
			opacity: interpolate(progress, [0, 0.08, 0.4, 0.48], [0, 1, 1, 0], Extrapolation.CLAMP),
			transform: [{ scale: interpolate(progress, [0, 0.08, 0.4, 0.48], [0.4, 1, 1, 0.9], Extrapolation.CLAMP) }],
		};
	});
	const tagStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: interpolate(cycle.get(), [0, 0.25, 0.5, 0.75, 1], [0, -6, 0, -6, 0]) }],
	}));
	const glowProps = useAnimatedProps(() => ({
		opacity: reducedMotion ? 0 : interpolate(cycle.get(), [0.45, 0.52, 0.7], [0, 1, 0], Extrapolation.CLAMP),
	}));

	/** 화면이 보이고 움직임 줄이기 설정이 꺼져 있으면 장면 반복 */
	useEffect(() => {
		if (!animated) {
			return;
		}

		cycle.set(0);
		cycle.set(withRepeat(withTiming(1, { duration: CYCLE_MS, easing: Easing.linear }), -1));

		return () => cancelAnimation(cycle);
	}, [animated, cycle]);

	const handleLayout = (event: LayoutChangeEvent) => {
		const { width, height } = event.nativeEvent.layout;

		setArea({ width, height });
	};

	return (
		<SceneStage
			label={t('common.illustration', { scene: t('onboarding.permissions.scene') })}
			stageWidth={STAGE_WIDTH}
			stageHeight={STAGE_HEIGHT}
			scale={scale}
			onLayout={handleLayout}
		>
			<Svg
				width="100%"
				height="100%"
				viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`}
				style={StyleSheet.absoluteFill}
			>
				{/*새장*/}
				<G transform="translate(20 90)" fill="none" stroke={colors.subtle} strokeLinecap="round">
					<Path d="M95 8v14M10 120C10 60 50 22 95 22s85 38 85 98M10 120v122M180 120v122" strokeWidth={3} />
					<Circle cx={95} cy={6} r={5} strokeWidth={3} />
					<Path d="M38 66v176M66 36v206M95 22v220M124 36v206M152 66v176M10 120h170" strokeWidth={2.5} />
					<Path d="M4 246h182" strokeWidth={6} />
					<Path d="M30 196h130" stroke={colors.orangeDark} strokeWidth={5} />
				</G>

				{/*새장 앞 휴대폰*/}
				<AnimatedRect
					x={265}
					y={268}
					width={104}
					height={76}
					rx={16}
					fill={colors.orangeSoft}
					animatedProps={glowProps}
				/>
				<Rect x={269} y={272} width={96} height={68} rx={12} fill={sessionColors.edge} />
				<Rect x={274} y={277} width={86} height={58} rx={8} fill={sessionColors.background} />
				<G transform="translate(290 291)" fill="none" strokeWidth={5} strokeLinecap="round">
					<Path d="M5 26a22 22 0 0 1 44 0" stroke={sessionColors.track} />
					<Path d="M5 26a22 22 0 0 1 13-20" stroke={sessionPhaseColors.learning} />
				</G>
			</Svg>

			<SceneWindow scale={scale} animated={animated} style={{ left: 28 * scale, top: 10 * scale }} />

			<View style={[styles.mascot, { left: 59 * scale, bottom: 37 * scale }]}>
				<Mascot size={112 * scale} floating={false} />
			</View>

			<Animated.View style={[styles.word, { left: 150 * scale, bottom: 124 * scale }, wordStyle]}>
				<Copy style={styles.wordText}>{t('onboarding.permissions.buddyWord')}</Copy>
			</Animated.View>

			<PermissionSceneWaves scale={scale} animated={animated} style={{ left: 215 * scale, bottom: 44 * scale }} />

			<Animated.View style={[styles.tag, { right: 16 * scale, bottom: 78 * scale }, tagStyle]}>
				<View style={styles.tagIcon}>
					<MicIcon size={16} color={colors.onFilled} />
				</View>
				<Copy style={styles.tagText}>{t('onboarding.permissions.listening')}</Copy>
			</Animated.View>

			<PermissionSceneAlert cycle={cycle} style={{ right: 14 * scale, top: 8 * scale }} />
		</SceneStage>
	);
};

const styles = StyleSheet.create({
	mascot: { position: 'absolute' },
	word: {
		position: 'absolute',
		paddingVertical: 4,
		paddingHorizontal: 12,
		borderWidth: 2,
		borderColor: colors.border,
		borderRadius: radius.tile,
		borderBottomLeftRadius: radius.xsmall,
		borderCurve: 'continuous',
		backgroundColor: colors.background,
		transformOrigin: 'left bottom',
	},
	wordText: { fontFamily: font.black, fontSize: 16, lineHeight: 22 },
	tag: {
		position: 'absolute',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingVertical: 5,
		paddingLeft: 5,
		paddingRight: 14,
		borderWidth: 2,
		borderColor: colors.border,
		borderRadius: radius.pill,
		backgroundColor: colors.background,
	},
	tagIcon: {
		width: 28,
		height: 28,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: radius.pill,
		backgroundColor: colors.orange,
	},
	tagText: { fontFamily: font.extraBold, fontSize: 14, lineHeight: 18 },
});

export default PermissionScene;
