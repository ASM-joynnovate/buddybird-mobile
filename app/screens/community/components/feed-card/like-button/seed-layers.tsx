import { StyleSheet } from 'react-native';

import Animated, {
	Extrapolation,
	interpolate,
	type SharedValue,
	useAnimatedProps,
	useAnimatedStyle,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Mask, Path, Rect } from 'react-native-svg';

import FeedCardLikeButtonChip from '@/screens/community/components/feed-card/like-button/chip';
import FeedCardLikeButtonCrumb from '@/screens/community/components/feed-card/like-button/crumb';
import FeedCardLikeButtonHull, { SEED_OUTLINE } from '@/screens/community/components/feed-card/like-button/hull';
import { seedColors } from '@/theme/seed-colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const SEAM_LENGTH = 60.2;
const BITE_MS = 90;
const JOLT_MS = 150;

const LID_TIMES = [0, 211, 260, 300, 352, 400, 450, 490, 525, 582, 640];
const LID_X = [0, 0, 1.4, 2.4, 2.8, 3.9, 4.8, 5.3, 5.5, 5.5, 5.5];
const LID_Y = [0, 0, -1.8, -2.7, -2.8, -1.5, 0.8, 2.7, 4.3, 3, 3.4];
const LID_ROTATE = [0, 0, 5, 10, 14, 19, 23, 26, 28, 28, 28];

const BITES = [
	{ at: 560, cx: 16.4, cy: 7.8, r: 5.2 },
	{ at: 680, cx: 15.4, cy: 15, r: 5.6 },
	{ at: 800, cx: 16.2, cy: 22.4, r: 6.2 },
];

const CHIPS = [
	{ startAt: 200, x: 16.1, y: 6.1, dx: -5.1, dy: -8.7, size: 3.6, color: seedColors.hull },
	{ startAt: 200, x: 16.1, y: 6.1, dx: 6.6, dy: -11.4, size: 3.6, color: seedColors.stripe },
	{ startAt: 200, x: 16.1, y: 6.1, dx: 15.6, dy: -5.7, size: 3.6, color: seedColors.hull },
];

const CRUMBS = [
	{ startAt: 575, x: 12.5, y: 4.3, dx: -8.7, dy: -7.5, size: 4.2, color: seedColors.kernel },
	{ startAt: 575, x: 12.5, y: 4.3, dx: -1.2, dy: -15, size: 3, color: seedColors.kernelWrinkle },
	{ startAt: 575, x: 12.5, y: 4.3, dx: 12, dy: -14.4, size: 4.2, color: seedColors.kernel },
	{ startAt: 695, x: 9.3, y: 8.1, dx: -8.7, dy: -7.5, size: 4.2, color: seedColors.kernel },
	{ startAt: 695, x: 9.3, y: 8.1, dx: -1.2, dy: -15, size: 3, color: seedColors.kernelWrinkle },
	{ startAt: 695, x: 9.3, y: 8.1, dx: 12, dy: -14.4, size: 4.2, color: seedColors.kernel },
	{ startAt: 815, x: 7.1, y: 12.7, dx: -8.7, dy: -7.5, size: 4.2, color: seedColors.kernel },
	{ startAt: 815, x: 7.1, y: 12.7, dx: -1.2, dy: -15, size: 3, color: seedColors.kernelWrinkle },
	{ startAt: 815, x: 7.1, y: 12.7, dx: 12, dy: -14.4, size: 4.2, color: seedColors.kernel },
];

/**
 * 껍질 투명도 계산 함수
 * @param elapsed 좋아요 애니메이션 경과 시간
 * @param closeProgress 껍질이 닫히는 진행률
 */
const getShellOpacity = (elapsed: number, closeProgress: number) => {
	'worklet';

	return (
		interpolate(elapsed, [0, 1], [0, 1], Extrapolation.CLAMP) *
		interpolate(closeProgress, [0, 0.5], [1, 0], Extrapolation.CLAMP)
	);
};

/**
 * 속씨 흔들림 계산 함수
 * @param elapsed 좋아요 애니메이션 경과 시간
 */
const getKernelJolt = (elapsed: number) => {
	'worklet';

	return BITES.reduce(
		(jolt, bite) =>
			jolt +
			interpolate(elapsed, [bite.at, bite.at + JOLT_MS * 0.3, bite.at + JOLT_MS], [0, 1, 0], Extrapolation.CLAMP),
		0,
	);
};

interface Props {
	elapsed: SharedValue<number>;
	closeProgress: SharedValue<number>;
}

/**
 * 해바라기 씨 애니메이션 레이어 컴포넌트
 * @param elapsed 좋아요 애니메이션 경과 시간
 * @param closeProgress 껍질이 닫히는 진행률
 */
const FeedCardLikeButtonSeedLayers = ({ elapsed, closeProgress }: Props) => {
	const shiftStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateX: interpolate(elapsed.get(), [260, 640], [0, -1], Extrapolation.CLAMP) },
			{ scale: interpolate(elapsed.get(), [260, 640], [1, 0.84], Extrapolation.CLAMP) },
		],
	}));
	const pinchStyle = useAnimatedStyle(() => ({
		transform: [
			{ scaleX: interpolate(elapsed.get(), [0, 99, 220], [1, 0.86, 1], Extrapolation.CLAMP) },
			{ scaleY: interpolate(elapsed.get(), [0, 99, 220], [1, 0.92, 1], Extrapolation.CLAMP) },
		],
	}));
	const backStyle = useAnimatedStyle(() => ({ opacity: getShellOpacity(elapsed.get(), closeProgress.get()) }));
	const kernelStyle = useAnimatedStyle(() => {
		const jolt = getKernelJolt(elapsed.get());

		return {
			opacity:
				interpolate(elapsed.get(), [0, 1, 893, 930], [0, 1, 1, 0], Extrapolation.CLAMP) *
				getShellOpacity(elapsed.get(), closeProgress.get()),
			transform: [{ translateX: -0.4 * jolt }, { translateY: 0.6 * jolt }, { rotate: `${-7 * jolt}deg` }],
		};
	});
	const lidStyle = useAnimatedStyle(() => ({
		opacity: getShellOpacity(elapsed.get(), closeProgress.get()),
		transform: [
			{ translateX: interpolate(elapsed.get(), LID_TIMES, LID_X, Extrapolation.CLAMP) },
			{ translateY: interpolate(elapsed.get(), LID_TIMES, LID_Y, Extrapolation.CLAMP) },
			{ rotate: `${interpolate(elapsed.get(), LID_TIMES, LID_ROTATE, Extrapolation.CLAMP)}deg` },
		],
	}));
	const flipStyle = useAnimatedStyle(() => ({
		transform: [
			{ rotate: '32deg' },
			{ scaleX: interpolate(elapsed.get(), [250, 360, 470], [1, 0.05, 1], Extrapolation.CLAMP) },
			{ rotate: '-32deg' },
		],
	}));
	const lidOutsideStyle = useAnimatedStyle(() => ({
		opacity: interpolate(elapsed.get(), [359, 360], [1, 0], Extrapolation.CLAMP),
	}));
	const lidInsideStyle = useAnimatedStyle(() => ({
		opacity: interpolate(elapsed.get(), [359, 360], [0, 1], Extrapolation.CLAMP),
	}));
	const wholeStyle = useAnimatedStyle(() => ({
		opacity: Math.max(
			interpolate(elapsed.get(), [0, 1], [1, 0], Extrapolation.CLAMP),
			interpolate(closeProgress.get(), [0.6, 0.75], [0, 1], Extrapolation.CLAMP),
		),
		transform: [
			{
				scale: interpolate(
					closeProgress.get(),
					[0, 0.01, 0.6, 0.75, 1],
					[1, 0.6, 0.6, 1.1, 1],
					Extrapolation.CLAMP,
				),
			},
		],
	}));
	const seamProps = useAnimatedProps(() => ({
		strokeDashoffset: interpolate(elapsed.get(), [104, 224], [SEAM_LENGTH, 0], Extrapolation.CLAMP),
		strokeOpacity: interpolate(elapsed.get(), [20, 104, 224, 260], [0, 1, 1, 0], Extrapolation.CLAMP),
	}));
	const firstBiteProps = useAnimatedProps(() => ({
		r: interpolate(elapsed.get(), [BITES[0].at, BITES[0].at + BITE_MS], [0, BITES[0].r], Extrapolation.CLAMP),
	}));
	const secondBiteProps = useAnimatedProps(() => ({
		r: interpolate(elapsed.get(), [BITES[1].at, BITES[1].at + BITE_MS], [0, BITES[1].r], Extrapolation.CLAMP),
	}));
	const thirdBiteProps = useAnimatedProps(() => ({
		r: interpolate(elapsed.get(), [BITES[2].at, BITES[2].at + BITE_MS], [0, BITES[2].r], Extrapolation.CLAMP),
	}));

	return (
		<>
			<Animated.View style={[styles.layer, shiftStyle]}>
				<Animated.View style={[styles.layer, pinchStyle]}>
					{/*뒤쪽 껍질*/}
					<Animated.View style={[styles.layer, backStyle]}>
						<FeedCardLikeButtonHull side="inside" />
					</Animated.View>

					{/*속씨*/}
					<Animated.View style={[styles.layer, kernelStyle]}>
						<Svg viewBox="0 0 32 32" style={StyleSheet.absoluteFill}>
							<Defs>
								<Mask id="kernel-bites" maskUnits="userSpaceOnUse" x={-8} y={-8} width={48} height={48}>
									<Rect x={-8} y={-8} width={48} height={48} fill="white" />
									<AnimatedCircle
										cx={BITES[0].cx}
										cy={BITES[0].cy}
										fill="black"
										animatedProps={firstBiteProps}
									/>
									<AnimatedCircle
										cx={BITES[1].cx}
										cy={BITES[1].cy}
										fill="black"
										animatedProps={secondBiteProps}
									/>
									<AnimatedCircle
										cx={BITES[2].cx}
										cy={BITES[2].cy}
										fill="black"
										animatedProps={thirdBiteProps}
									/>
								</Mask>
							</Defs>
							<G transform="rotate(32 16 16)" mask="url(#kernel-bites)">
								<Path
									d="M16 6.1c1.7 2.7 3.5 7.6 3.9 12.4.3 4.1-1.3 7.7-3.9 7.9-2.6.2-4.2-3.4-4-7.6.3-4.9 2.1-9.7 4-12.7Z"
									fill={seedColors.kernel}
									stroke={seedColors.kernelEdge}
									strokeWidth={0.7}
								/>
								<Path
									d="M16.5 9.4c.3 4.6-.1 10.3-.9 15.2"
									stroke={seedColors.kernelSeam}
									strokeWidth={0.7}
									strokeLinecap="round"
									fill="none"
								/>
								<Path
									d="M13.7 15.2c-.3 2.9 0 5.6 1 7.4"
									stroke={seedColors.kernelShine}
									strokeWidth={1.2}
									strokeLinecap="round"
									fill="none"
								/>
								<Path
									d="M18.3 13.4c.6 2.5.7 5.3.3 7.8"
									stroke={seedColors.kernelWrinkle}
									strokeWidth={0.5}
									strokeLinecap="round"
									fill="none"
								/>
								<Circle cx={16} cy={6.8} r={0.6} fill={seedColors.kernelTip} />
							</G>
						</Svg>
					</Animated.View>

					{/*앞쪽 껍질*/}
					<Animated.View style={[styles.lidLayer, lidStyle]}>
						<Animated.View style={[styles.layer, flipStyle]}>
							<Animated.View style={[styles.layer, lidOutsideStyle]}>
								<FeedCardLikeButtonHull side="outside" />
							</Animated.View>
							<Animated.View style={[styles.layer, lidInsideStyle]}>
								<FeedCardLikeButtonHull side="inside" />
							</Animated.View>
						</Animated.View>
					</Animated.View>

					{/*갈라지기 전 씨*/}
					<Animated.View style={[styles.layer, wholeStyle]}>
						<FeedCardLikeButtonHull side="outside" />
					</Animated.View>

					{/*껍질 이음매*/}
					<Svg viewBox="0 0 32 32" style={StyleSheet.absoluteFill}>
						<G transform="rotate(32 16 16)">
							<AnimatedPath
								d={SEED_OUTLINE}
								fill="none"
								stroke={seedColors.seam}
								strokeWidth={0.8}
								strokeLinejoin="round"
								strokeDasharray={SEAM_LENGTH}
								animatedProps={seamProps}
							/>
						</G>
					</Svg>
				</Animated.View>
			</Animated.View>

			{CHIPS.map((chip, index) => (
				<FeedCardLikeButtonChip key={index} elapsed={elapsed} {...chip} />
			))}
			{CRUMBS.map((crumb, index) => (
				<FeedCardLikeButtonCrumb key={index} elapsed={elapsed} closeProgress={closeProgress} {...crumb} />
			))}
		</>
	);
};

const styles = StyleSheet.create({
	layer: StyleSheet.absoluteFill,
	lidLayer: { ...StyleSheet.absoluteFill, transformOrigin: [6.4, 18.4, 0] },
});

export default FeedCardLikeButtonSeedLayers;
