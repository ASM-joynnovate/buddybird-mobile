import { useEffect } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { PlayIcon } from 'lucide-react-native';
import Animated, {
	cancelAnimation,
	Easing,
	Extrapolation,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { SECOND } from '@/config/units';
import { popIn } from '@/screens/onboarding/components/usage-scene-animations';
import UsageSceneCage from '@/screens/onboarding/components/usage-scene/cage';
import { colors, font, radius } from '@/theme';

import Mascot from '@/components/mascot';
import { Copy } from '@/components/ui/copy';

const FLIGHT_MS = 2.6 * SECOND;

interface Props {
	scale: number;
	animated: boolean;
}

/**
 * 새장 앞에 세운 휴대폰이 앵무새에게 단어를 들려주는 장면 컴포넌트
 * @param scale 그림 배율
 * @param animated 단어가 날아가는 움직임 실행 여부
 */
const UsageScenePlace = ({ scale, animated }: Props) => {
	const { t } = useTranslation();

	const flightProgress = useSharedValue(0);

	const words = t('onboarding.login.words', { returnObjects: true });

	const wordStyle = useAnimatedStyle(() => {
		if (!animated) {
			return { opacity: 1 };
		}

		const progress = flightProgress.get();

		return {
			opacity: interpolate(progress, [0.1, 0.22, 0.62, 0.78], [0, 1, 1, 0], Extrapolation.CLAMP),
			transform: [
				{ translateX: interpolate(progress, [0.1, 0.62, 0.78], [0, 104, 118], Extrapolation.CLAMP) * scale },
				{ translateY: interpolate(progress, [0.1, 0.62], [0, -20], Extrapolation.CLAMP) * scale },
			],
		};
	});

	/** 움직임이 켜져 있으면 단어가 휴대폰에서 새장으로 날아가기를 반복 */
	useEffect(() => {
		if (!animated) {
			return;
		}

		flightProgress.set(0);
		flightProgress.set(withRepeat(withTiming(1, { duration: FLIGHT_MS, easing: Easing.linear }), -1));

		return () => cancelAnimation(flightProgress);
	}, [animated, flightProgress]);

	return (
		<>
			{/*새장과 횃대 위 앵무새*/}
			<Animated.View entering={popIn(1)} style={[styles.sceneItem, { left: 145 * scale, bottom: 0 }]}>
				<UsageSceneCage
					width={240 * scale}
					barColor={colors.background}
					trayColor={colors.background}
					trayEdgeColor={colors.orangeSoft}
				/>
			</Animated.View>
			<Animated.View entering={popIn(2)} style={[styles.sceneItem, { left: 205 * scale, bottom: 70 * scale }]}>
				<Mascot size={120 * scale} floating={false} />
			</Animated.View>

			{/*새장 앞에 세운 휴대폰*/}
			<Animated.View
				entering={popIn(0)}
				style={[styles.sceneItem, { left: 34 * scale, bottom: 0, width: 100 * scale, height: 184 * scale }]}
			>
				<View style={[styles.phone, { padding: 7 * scale, borderRadius: 22 * scale }]}>
					<View style={[styles.phoneScreen, { borderRadius: 15 * scale }]}>
						<View
							style={[
								styles.playButtonEdge,
								{ width: 52 * scale, height: 52 * scale, paddingBottom: 4 * scale },
							]}
						>
							<View style={styles.playButton}>
								<PlayIcon size={22 * scale} color={colors.onFilled} fill={colors.onFilled} />
							</View>
						</View>
					</View>
				</View>
			</Animated.View>

			{/*휴대폰에서 나오는 소리*/}
			<Svg
				width={46 * scale}
				height={61 * scale}
				viewBox="0 0 60 80"
				style={[styles.sceneItem, { left: 140 * scale, bottom: 62 * scale }]}
			>
				<Path
					d="M8 28Q18 40 8 52M24 18Q42 40 24 62M40 8Q66 40 40 72"
					fill="none"
					stroke={colors.background}
					strokeWidth={6}
					strokeLinecap="round"
				/>
			</Svg>

			{/*새장으로 날아가는 단어*/}
			<Animated.View style={[styles.sceneItem, { left: 50 * scale, bottom: 200 * scale }, wordStyle]}>
				<View style={styles.word}>
					<Copy style={styles.wordText}>{words[0]}</Copy>
				</View>
			</Animated.View>
		</>
	);
};

const styles = StyleSheet.create({
	sceneItem: { position: 'absolute' },
	phone: { flex: 1, transform: [{ rotate: '-4deg' }], backgroundColor: colors.background },
	phoneScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.orangePale },
	playButtonEdge: { borderRadius: radius.pill, backgroundColor: colors.orangeDark },
	playButton: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: radius.pill,
		backgroundColor: colors.orange,
	},
	word: {
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: radius.pill,
		transform: [{ rotate: '-5deg' }],
		backgroundColor: colors.background,
	},
	wordText: { fontFamily: font.black, fontSize: 24, lineHeight: 30, color: colors.orangeDark },
});

export default UsageScenePlace;
