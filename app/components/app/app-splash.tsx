import * as SplashScreen from "expo-splash-screen"

import { useEffect, useRef, useState } from "react"

import { StyleSheet } from "react-native"

import Animated, {
	cancelAnimation,
	Easing,
	runOnJS,
	type SharedValue,
	useAnimatedProps,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withSequence,
	withTiming,
} from "react-native-reanimated"

import Svg, { Ellipse, G, Path, Rect, Text as SvgText } from "react-native-svg"

import { reportError } from "@/services/telemetry/client"
import { colors, font } from "@/theme"
import artwork from "@assets/images/splash-artwork.json"

const AnimatedRect = Animated.createAnimatedComponent(Rect)
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse)

function SplashEye({ offset, openness }: { offset: number; openness: SharedValue<number> }) {
	const white = useAnimatedProps(() => ({
		y: 755 - 196 * openness.get(),
		height: 392 * openness.get(),
	}))
	const pupil = useAnimatedProps(() => ({
		cy: 755 + 36.5 * openness.get(),
		ry: 73.5 * openness.get(),
	}))
	const glint = useAnimatedProps(() => ({
		cy: 755 + 6.5 * openness.get(),
		ry: 19.5 * openness.get(),
	}))

	return (
		<>
			<AnimatedRect
				x={54 + offset}
				width={240}
				rx={120}
				fill={artwork.eyeWhite}
				animatedProps={white}
			/>
			<AnimatedEllipse cx={177 + offset} rx={61} fill={artwork.pupil} animatedProps={pupil} />
			<AnimatedEllipse
				cx={195.5 + offset}
				rx={18.5}
				fill={artwork.eyeWhite}
				animatedProps={glint}
			/>
		</>
	)
}

export function AppSplash({ ready, onComplete }: { ready: boolean; onComplete(): void }) {
	const reducedMotion = useReducedMotion()
	const [shown, setShown] = useState(false)
	const [blinked, setBlinked] = useState(reducedMotion)
	const laidOut = useRef(false)
	const eyes = useSharedValue(1)
	const enter = useSharedValue(reducedMotion ? 1 : 0)
	const opacity = useSharedValue(1)
	const enterStyle = useAnimatedStyle(() => ({
		opacity: enter.get(),
		transform: [{ scale: 1.035 - 0.035 * enter.get() }],
	}))
	const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }))

	useEffect(() => {
		if (!shown || reducedMotion) {
			return
		}

		enter.set(withTiming(1, { duration: 760, easing: Easing.bezier(0.22, 1, 0.36, 1) }))
		eyes.set(
			withDelay(
				1000,
				withSequence(
					withTiming(0.07, { duration: 90, easing: Easing.in(Easing.quad) }),
					withTiming(1, { duration: 130, easing: Easing.out(Easing.quad) }),
					withTiming(0.07, { duration: 90, easing: Easing.in(Easing.quad) }),
					withTiming(
						1,
						{ duration: 130, easing: Easing.out(Easing.quad) },
						(finished) => {
							if (finished) {
								runOnJS(setBlinked)(true)
							}
						},
					),
				),
			),
		)

		return () => {
			cancelAnimation(enter)
			cancelAnimation(eyes)
		}
	}, [enter, eyes, reducedMotion, shown])

	useEffect(() => {
		if (!ready || !shown || !blinked) {
			return
		}

		opacity.set(
			withTiming(0, { duration: reducedMotion ? 0 : 200 }, (finished) => {
				if (finished) {
					runOnJS(onComplete)()
				}
			}),
		)

		return () => cancelAnimation(opacity)
	}, [blinked, onComplete, opacity, ready, reducedMotion, shown])

	function reveal() {
		if (laidOut.current) {
			return
		}

		laidOut.current = true
		void SplashScreen.hideAsync()
			.catch((error) => reportError(error, "splash"))
			.finally(() => setShown(true))
	}

	return (
		<Animated.View
			accessible
			accessibilityLabel="BuddyBird"
			onLayout={reveal}
			style={[styles.screen, fadeStyle]}
		>
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
				<Svg
					width="100%"
					height="100%"
					viewBox="0 0 860 1851"
					preserveAspectRatio="xMidYMid meet"
				>
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
						fill="#F7F2EA"
					>
						BuddyBird
					</SvgText>
				</Svg>
			</Animated.View>
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	screen: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.brand },
})
