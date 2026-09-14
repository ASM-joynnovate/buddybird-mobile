import * as SplashScreen from "expo-splash-screen"

import { useEffect, useRef, useState } from "react"

import { Image, StyleSheet, View } from "react-native"

import Animated, {
	cancelAnimation,
	runOnJS,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withSequence,
	withTiming,
} from "react-native-reanimated"

import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg"

import { reportError } from "@/services/telemetry/client"
import { colors } from "@/theme"

export function AppSplash({ ready, onComplete }: { ready: boolean; onComplete(): void }) {
	const reducedMotion = useReducedMotion()
	const [shown, setShown] = useState(false)
	const [blinked, setBlinked] = useState(reducedMotion)
	const laidOut = useRef(false)
	const eyes = useSharedValue(1)
	const opacity = useSharedValue(1)
	const eyeStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: eyes.get() }] }))
	const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }))

	useEffect(() => {
		if (!shown || reducedMotion) {
			return
		}

		eyes.set(
			withSequence(
				withDelay(180, withTiming(0.06, { duration: 90 })),
				withTiming(1, { duration: 130 }, (finished) => {
					if (finished) {
						runOnJS(setBlinked)(true)
					}
				}),
			),
		)

		return () => cancelAnimation(eyes)
	}, [eyes, reducedMotion, shown])
	useEffect(() => {
		if (!ready || !shown || !blinked) {
			return
		}

		opacity.set(
			withTiming(0, { duration: reducedMotion ? 0 : 180 }, (finished) => {
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
			<View
				style={styles.mascot}
				accessibilityElementsHidden
				importantForAccessibility="no-hide-descendants"
			>
				<Svg width={220} height={220} viewBox="0 0 200 200">
					<Circle cx={100} cy={100} r={98} fill={colors.onAccent} />
					<Path
						d="M34 88 C34 8 166 8 166 88"
						fill="none"
						stroke={colors.text}
						strokeWidth={13}
					/>
					<Ellipse cx={100} cy={110} rx={65} ry={72} fill={colors.brand} />
					<Ellipse cx={100} cy={149} rx={45} ry={31} fill={colors.orange} />
					<Rect x={19} y={66} width={23} height={52} rx={11} fill={colors.text} />
					<Rect x={158} y={66} width={23} height={52} rx={11} fill={colors.text} />
					<Path d="M86 108 Q100 97 114 108 L100 130 Z" fill={colors.text} />
					<Ellipse cx={74} cy={181} rx={17} ry={7} fill={colors.orange} />
					<Ellipse cx={126} cy={181} rx={17} ry={7} fill={colors.orange} />
				</Svg>
				<Animated.View style={[styles.eyes, eyeStyle]}>
					<Svg width={106} height={47} viewBox="0 0 96 42">
						<Ellipse cx={20} cy={21} rx={16} ry={21} fill={colors.onAccent} />
						<Ellipse cx={76} cy={21} rx={16} ry={21} fill={colors.onAccent} />
						<Circle cx={23} cy={22} r={8} fill={colors.text} />
						<Circle cx={73} cy={22} r={8} fill={colors.text} />
					</Svg>
				</Animated.View>
			</View>
			<Image
				accessible={false}
				source={require("@assets/images/splash-wordmark.png")}
				style={styles.wordmark}
			/>
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	screen: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: colors.brand,
		justifyContent: "center",
		alignItems: "center",
	},
	mascot: { width: 220, height: 220 },
	eyes: { position: "absolute", left: 57, top: 67 },
	wordmark: { width: 340, height: 80, resizeMode: "cover", marginTop: 26 },
})
