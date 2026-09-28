import { useEffect, useRef, useState } from 'react';

import { StyleSheet } from 'react-native';

import * as SplashScreen from 'expo-splash-screen';
import Animated, {
	cancelAnimation,
	Easing,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withSequence,
	withTiming,
} from 'react-native-reanimated';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { reportError } from '@/services/telemetry/client';
import { colors, font } from '@/theme';
import { SECOND } from '@/utils/units';

import SplashEye from '@/components/app/app-splash/splash-eye';

import artwork from '@assets/images/splash-artwork.json';

interface Props {
	bootstrapSettled: boolean;
	onComplete: () => void;
}

/**
 * 눈을 깜빡이는 얼굴 그림과 앱 이름을 보여 주고 시작 준비가 끝나면 서서히 사라지는 스플래시 컴포넌트
 * @param bootstrapSettled 앱 시작 준비가 끝났는지 여부
 * @param onComplete 스플래시가 사라진 뒤 실행할 함수
 */
const AppSplash = ({ bootstrapSettled, onComplete }: Props) => {
	const reducedMotion = useReducedMotion();

	const eyeOpenness = useSharedValue(1);
	const enterProgress = useSharedValue(reducedMotion ? 1 : 0);
	const exitOpacity = useSharedValue(1);

	const [nativeSplashHidden, setNativeSplashHidden] = useState(false);
	const [blinked, setBlinked] = useState(reducedMotion);

	const laidOutRef = useRef(false);

	const enterStyle = useAnimatedStyle(() => ({
		opacity: enterProgress.get(),
		transform: [{ scale: 1.035 - 0.035 * enterProgress.get() }],
	}));
	const exitStyle = useAnimatedStyle(() => ({ opacity: exitOpacity.get() }));

	/** 기본 스플래시가 사라지면 등장 애니메이션과 눈 두 번 깜빡임 실행 */
	useEffect(() => {
		if (!nativeSplashHidden || reducedMotion) {
			return;
		}

		enterProgress.set(withTiming(1, { duration: 760, easing: Easing.bezier(0.22, 1, 0.36, 1) }));
		eyeOpenness.set(
			withDelay(
				SECOND,
				withSequence(
					withTiming(0.07, { duration: 90, easing: Easing.in(Easing.quad) }),
					withTiming(1, { duration: 130, easing: Easing.out(Easing.quad) }),
					withTiming(0.07, { duration: 90, easing: Easing.in(Easing.quad) }),
					withTiming(1, { duration: 130, easing: Easing.out(Easing.quad) }, (finished) => {
						if (finished) {
							scheduleOnRN(setBlinked, true);
						}
					}),
				),
			),
		);

		return () => {
			cancelAnimation(enterProgress);
			cancelAnimation(eyeOpenness);
		};
	}, [enterProgress, eyeOpenness, reducedMotion, nativeSplashHidden]);

	/** 시작 준비와 눈 깜빡임이 끝나면 스플래시를 서서히 숨긴 뒤 종료 함수 실행 */
	useEffect(() => {
		if (!bootstrapSettled || !nativeSplashHidden || !blinked) {
			return;
		}

		exitOpacity.set(
			withTiming(0, { duration: reducedMotion ? 0 : 200 }, (finished) => {
				if (finished) {
					scheduleOnRN(onComplete);
				}
			}),
		);

		return () => cancelAnimation(exitOpacity);
	}, [blinked, onComplete, exitOpacity, bootstrapSettled, reducedMotion, nativeSplashHidden]);

	/** 첫 배치 때 한 번만 기본 스플래시 숨기기 */
	const handleReveal = () => {
		if (laidOutRef.current) {
			return;
		}

		laidOutRef.current = true;

		void SplashScreen.hideAsync()
			.catch((error) => reportError(error, 'splash'))
			.finally(() => setNativeSplashHidden(true));
	};

	return (
		<Animated.View
			accessible
			accessibilityLabel="BuddyBird"
			onLayout={handleReveal}
			style={[styles.container, exitStyle]}
		>
			<Animated.View
				accessibilityElementsHidden
				importantForAccessibility="no-hide-descendants"
				style={[StyleSheet.absoluteFill, enterStyle]}
			>
				{/*몸통 그림*/}
				<Svg
					style={StyleSheet.absoluteFill}
					width="100%"
					height="100%"
					viewBox="0 0 860 1851"
					preserveAspectRatio="none"
				>
					<Path {...artwork.body} transform="translate(4 0)" />
				</Svg>

				{/*얼굴과 앱 이름*/}
				<Svg width="100%" height="100%" viewBox="0 0 860 1851" preserveAspectRatio="xMidYMid meet">
					<G transform="translate(4 0)">
						<SplashEye offsetX={0} openness={eyeOpenness} />
						<SplashEye offsetX={507} openness={eyeOpenness} />
						{artwork.face.map((part, index) => (
							<Path key={index} {...part} />
						))}
					</G>

					<SvgText
						x={430}
						y={1540}
						textAnchor="middle"
						fontFamily={font.splash}
						fontSize={104}
						fill={colors.onBrand}
					>
						BuddyBird
					</SvgText>
				</Svg>
			</Animated.View>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: { ...StyleSheet.absoluteFill, backgroundColor: colors.brand },
});

export default AppSplash;
