import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { MicIcon } from 'lucide-react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { colors, font, radius } from '@/theme';

import { popIn } from '@/components/scene-animations';
import { Copy } from '@/components/ui/copy';

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
const ARROW_WIDTH = 80;
const ARROW_HEIGHT = 20;
const PHONE_SLIDE_DELAY_MS = 250;
const PHONE_SLIDE_MS = 800;
const ARROW_GROW_DELAY_MS = 900;
const ARROW_GROW_MS = 500;
const LENGTH_APPEAR_ORDER = 16;

/** 휴대폰이 입에서 멀어지는 애니메이션 */
const slideAway = () => {
	return new Keyframe({
		0: { transform: [{ translateX: -80 }, { rotate: '-4deg' }] },
		100: { transform: [{ translateX: 0 }, { rotate: '-4deg' }], easing: Easing.out(Easing.back(1.3)) },
	})
		.duration(PHONE_SLIDE_MS)
		.delay(PHONE_SLIDE_DELAY_MS);
};

/** 화살표가 왼쪽부터 늘어나는 애니메이션 */
const growRight = () => {
	return new Keyframe({
		0: { transform: [{ scaleX: 0 }] },
		100: { transform: [{ scaleX: 1 }], easing: Easing.out(Easing.cubic) },
	})
		.duration(ARROW_GROW_MS)
		.delay(ARROW_GROW_DELAY_MS);
};

interface Props {
	scale: number;
}

/**
 * 입과 휴대폰 사이를 띄우는 장면 컴포넌트
 * @param scale 그림 배율
 */
const RecordingSceneDistance = ({ scale }: Props) => {
	const { t } = useTranslation();

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

			{/*입에서 떨어진 휴대폰*/}
			<Animated.View
				entering={slideAway()}
				style={[
					styles.sceneItem,
					styles.phone,
					{
						left: 246 * scale,
						bottom: 0,
						width: 96 * scale,
						height: 176 * scale,
						padding: 7 * scale,
						borderRadius: 22 * scale,
					},
				]}
			>
				<View style={[styles.phoneScreen, { borderRadius: 15 * scale }]}>
					<View style={[styles.micButton, { width: 48 * scale, height: 48 * scale }]}>
						<MicIcon size={24 * scale} color={colors.onFilled} />
					</View>
				</View>
			</Animated.View>

			{/*입과 휴대폰 사이 거리*/}
			<Animated.View
				entering={growRight()}
				style={[styles.sceneItem, styles.arrow, { left: 162 * scale, bottom: 80 * scale }]}
			>
				<Svg
					width={ARROW_WIDTH * scale}
					height={ARROW_HEIGHT * scale}
					viewBox={`0 0 ${ARROW_WIDTH} ${ARROW_HEIGHT}`}
				>
					<Path
						d={`M10 10H${ARROW_WIDTH - 10}`}
						stroke={colors.background}
						strokeWidth={3.5}
						strokeDasharray="7 7"
						strokeLinecap="round"
					/>
					<Path
						d={`M14 3 6 10l8 7M${ARROW_WIDTH - 14} 3l8 7-8 7`}
						fill="none"
						stroke={colors.background}
						strokeWidth={3.5}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</Svg>
			</Animated.View>
			<Animated.View
				entering={popIn(LENGTH_APPEAR_ORDER)}
				style={[
					styles.sceneItem,
					styles.lengthLabel,
					{
						left: 150 * scale,
						bottom: 120 * scale,
						paddingVertical: 8 * scale,
						paddingHorizontal: 16 * scale,
					},
				]}
			>
				<Copy style={[styles.lengthText, { fontSize: 18 * scale, lineHeight: 24 * scale }]}>
					{t('words.guide.distance.length')}
				</Copy>
			</Animated.View>
		</>
	);
};

const styles = StyleSheet.create({
	sceneItem: { position: 'absolute' },
	phone: { borderCurve: 'continuous', transform: [{ rotate: '-4deg' }], backgroundColor: colors.background },
	phoneScreen: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		borderCurve: 'continuous',
		backgroundColor: colors.orangePale,
	},
	micButton: {
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: radius.pill,
		backgroundColor: colors.orange,
	},
	arrow: { transformOrigin: 'left' },
	lengthLabel: { borderRadius: radius.pill, backgroundColor: colors.background },
	lengthText: { fontFamily: font.black, color: colors.orangeDark },
});

export default RecordingSceneDistance;
