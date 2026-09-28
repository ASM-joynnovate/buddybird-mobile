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

import { SplashEye } from '@/components/app/app-splash/splash-eye';

import artwork from '@assets/images/splash-artwork.json';

interface Props {
	ready: boolean;
	onComplete(): void;
}

export function AppSplash({ ready, onComplete }: Props) {
	const reducedMotion = useReducedMotion();

	const [shown, setShown] = useState(false);
	const [blinked, setBlinked] = useState(reducedMotion);

	const laidOut = useRef(false);

	const eyes = useSharedValue(1);
	const enter = useSharedValue(reducedMotion ? 1 : 0);
	const opacity = useSharedValue(1);
	const enterStyle = useAnimatedStyle(() => ({
		opacity: enter.get(),
		transform: [{ scale: 1.035 - 0.035 * enter.get() }],
	}));
	const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

	useEffect(() => {
		if (!shown || reducedMotion) {
			return;
		}

		enter.set(withTiming(1, { duration: 760, easing: Easing.bezier(0.22, 1, 0.36, 1) }));
		eyes.set(
			withDelay(
				1000,
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
			cancelAnimation(enter);
			cancelAnimation(eyes);
		};
	}, [enter, eyes, reducedMotion, shown]);

	useEffect(() => {
		if (!ready || !shown || !blinked) {
			return;
		}

		opacity.set(
			withTiming(0, { duration: reducedMotion ? 0 : 200 }, (finished) => {
				if (finished) {
					scheduleOnRN(onComplete);
				}
			}),
		);

		return () => cancelAnimation(opacity);
	}, [blinked, onComplete, opacity, ready, reducedMotion, shown]);

	function reveal() {
		if (laidOut.current) {
			return;
		}

		laidOut.current = true;

		void SplashScreen.hideAsync()
			.catch((error) => reportError(error, 'splash'))
			.finally(() => setShown(true));
	}

	return (
		<Animated.View accessible accessibilityLabel="BuddyBird" onLayout={reveal} style={[styles.screen, fadeStyle]}>
			<Animated.View
				accessibilityElementsHidden
				importantForAccessibility="no-hide-descendants"
				style={[StyleSheet.absoluteFill, enterStyle]}
			>
				<Svg
					style={StyleSheet.absoluteFill}
					width="100%"
					height="100%"
					viewBox="0 0 860 1851"
					preserveAspectRatio="none"
				>
					<Path {...artwork.body} transform="translate(4 0)" />
				</Svg>
				<Svg width="100%" height="100%" viewBox="0 0 860 1851" preserveAspectRatio="xMidYMid meet">
					<G transform="translate(4 0)">
						<SplashEye offset={0} openness={eyes} />
						<SplashEye offset={507} openness={eyes} />
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
