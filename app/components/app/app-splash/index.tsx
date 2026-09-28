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

import { SplashEye } from '@/components/app/app-splash/splash-eye';

import artwork from '@assets/images/splash-artwork.json';

interface Props {
	bootstrapSettled: boolean;
	onComplete(): void;
}

export function AppSplash({ bootstrapSettled, onComplete }: Props) {
	const reducedMotion = useReducedMotion();

	const eyeOpenness = useSharedValue(1);
	const enterProgress = useSharedValue(reducedMotion ? 1 : 0);
	const exitOpacity = useSharedValue(1);
	const enterStyle = useAnimatedStyle(() => ({
		opacity: enterProgress.get(),
		transform: [{ scale: 1.035 - 0.035 * enterProgress.get() }],
	}));
	const exitStyle = useAnimatedStyle(() => ({ opacity: exitOpacity.get() }));

	const [nativeSplashHidden, setNativeSplashHidden] = useState(false);
	const [blinked, setBlinked] = useState(reducedMotion);

	const laidOut = useRef(false);

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

	function reveal() {
		if (laidOut.current) {
			return;
		}

		laidOut.current = true;

		void SplashScreen.hideAsync()
			.catch((error) => reportError(error, 'splash'))
			.finally(() => setNativeSplashHidden(true));
	}

	return (
		<Animated.View accessible accessibilityLabel="BuddyBird" onLayout={reveal} style={[styles.screen, exitStyle]}>
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
}

const styles = StyleSheet.create({
	screen: { ...StyleSheet.absoluteFill, backgroundColor: colors.brand },
});
