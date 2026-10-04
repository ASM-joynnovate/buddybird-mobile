import { useEffect } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { SunIcon } from 'lucide-react-native';
import Animated, {
	cancelAnimation,
	Easing,
	useAnimatedProps,
	useSharedValue,
	withDelay,
	withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { SECOND } from '@/config/units';
import UsageSceneCage from '@/screens/onboarding/components/usage-scene/cage';
import { font, radius } from '@/theme';
import { sessionColors, sessionPhaseColors } from '@/theme/session-colors';

import Mascot from '@/components/mascot';
import { popIn } from '@/components/scene-animations';
import { SCENE_FLOOR_HEIGHT } from '@/components/scene-stage';
import { Copy } from '@/components/ui/copy';

const ARC_PATH = 'M8 80A72 72 0 0 1 152 80';
const ARC_LENGTH = 226;
const LEARNING_PROGRESS_RATIO = 0.62;
const ARC_FILL_DELAY_MS = 400;
const ARC_FILL_MS = 2.4 * SECOND;

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Props {
	scale: number;
	animated: boolean;
}

/**
 * 어두운 방에서 화면을 켠 채 충전하는 휴대폰 장면 컴포넌트
 * @param scale 그림 배율
 * @param animated 진행률이 차오르는 움직임 실행 여부
 */
const UsageSceneKeepOn = ({ scale, animated }: Props) => {
	const { t } = useTranslation();

	const arcProgress = useSharedValue(1);

	const arcProps = useAnimatedProps(() => ({
		strokeDashoffset: ARC_LENGTH * (1 - LEARNING_PROGRESS_RATIO * arcProgress.get()),
	}));

	/** 움직임이 켜져 있으면 학습 진행률이 차오름 */
	useEffect(() => {
		if (!animated) {
			return;
		}

		arcProgress.set(0);
		arcProgress.set(
			withDelay(ARC_FILL_DELAY_MS, withTiming(1, { duration: ARC_FILL_MS, easing: Easing.out(Easing.cubic) })),
		);

		return () => cancelAnimation(arcProgress);
	}, [animated, arcProgress]);

	return (
		<>
			{/*충전 선*/}
			<View style={[styles.cable, { left: 70 * scale }]} />

			{/*새장과 잠든 앵무새*/}
			<Animated.View entering={popIn(1)} style={[styles.sceneItem, { left: 193 * scale, bottom: 0 }]}>
				<UsageSceneCage
					width={200 * scale}
					barColor={sessionColors.track}
					trayColor={sessionColors.background}
					trayEdgeColor={sessionColors.track}
				/>
			</Animated.View>
			<Animated.View
				entering={popIn(1)}
				style={[styles.mascotContainer, { left: 243 * scale, bottom: 59 * scale }]}
			>
				<Mascot size={100 * scale} floating={false} />
			</Animated.View>

			{/*학습 중인 휴대폰 화면*/}
			<Animated.View
				entering={popIn(0)}
				style={[styles.sceneItem, { left: 16 * scale, bottom: 0, width: 240 * scale, height: 140 * scale }]}
			>
				<View style={[styles.phone, { paddingBottom: 14 * scale, borderRadius: 28 * scale }]}>
					<Copy style={styles.batteryText}>82%</Copy>

					<View style={{ width: 160 * scale, height: 88 * scale }}>
						<Svg width="100%" height="100%" viewBox="0 0 160 88" style={StyleSheet.absoluteFill}>
							<Path
								d={ARC_PATH}
								fill="none"
								stroke={sessionColors.track}
								strokeWidth={14}
								strokeLinecap="round"
							/>
							<AnimatedPath
								d={ARC_PATH}
								fill="none"
								stroke={sessionPhaseColors.learning}
								strokeWidth={14}
								strokeLinecap="round"
								strokeDasharray={`${ARC_LENGTH} ${ARC_LENGTH}`}
								animatedProps={arcProps}
							/>
						</Svg>

						<View style={styles.arcTextContainer}>
							<Copy style={styles.phaseText}>{t('common.phases.learning')}</Copy>
							<Copy style={styles.timeText}>07:12</Copy>
						</View>
					</View>
				</View>
			</Animated.View>

			{/*켜진 화면 표시*/}
			<Animated.View
				entering={popIn(2)}
				style={[
					styles.screenOnBadge,
					{ left: 4 * scale, bottom: 116 * scale, width: 48 * scale, height: 48 * scale },
				]}
			>
				<SunIcon size={24 * scale} color={sessionColors.text} />
			</Animated.View>
		</>
	);
};

const styles = StyleSheet.create({
	sceneItem: { position: 'absolute' },
	cable: {
		position: 'absolute',
		bottom: -SCENE_FLOOR_HEIGHT,
		width: 3,
		height: SCENE_FLOOR_HEIGHT,
		backgroundColor: sessionColors.edge,
	},
	mascotContainer: { position: 'absolute', opacity: 0.3 },
	phone: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'flex-end',
		borderWidth: 3,
		borderColor: sessionColors.edge,
		borderCurve: 'continuous',
		backgroundColor: sessionColors.background,
	},
	batteryText: {
		position: 'absolute',
		top: 12,
		right: 16,
		fontFamily: font.extraBold,
		fontSize: 11,
		color: sessionColors.faint,
		fontVariant: ['tabular-nums'],
	},
	arcTextContainer: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
	phaseText: { fontFamily: font.black, fontSize: 13, lineHeight: 17, color: sessionColors.text },
	timeText: {
		fontFamily: font.black,
		fontSize: 20,
		lineHeight: 24,
		color: sessionColors.text,
		fontVariant: ['tabular-nums'],
	},
	screenOnBadge: {
		position: 'absolute',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 2,
		borderColor: sessionColors.edge,
		borderRadius: radius.pill,
		backgroundColor: sessionColors.background,
	},
});

export default UsageSceneKeepOn;
