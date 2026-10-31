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

import { SECOND } from '@/config/units';
import { reportError } from '@/services/telemetry/client';
import { colors, font } from '@/theme';

import AppSplashProgressBar from '@/components/app/app-splash/progress-bar';
import SplashEye from '@/components/app/app-splash/splash-eye';

import artwork from '@assets/images/splash-artwork.json';

interface Props {
	bootstrapSettled?: boolean;
	downloadProgress?: number;
	onComplete?: () => void;
}

/**
 * 앱 시작 스플래시 컴포넌트
 * @param bootstrapSettled 앱 시작 준비 완료 여부
 * @param downloadProgress 0에서 1 사이의 긴급 업데이트 다운로드 진행률
 * @param onComplete 스플래시가 사라진 뒤 실행할 함수
 */
const AppSplash = ({ bootstrapSettled, downloadProgress, onComplete }: Props) => {
	const motionReduced = useReducedMotion();

	const eyeOpenness = useSharedValue(1);
	const enterProgress = useSharedValue(motionReduced ? 1 : 0);
	const exitOpacity = useSharedValue(1);
	const downloadFill = useSharedValue(downloadProgress ?? 0);

	const [nativeSplashHidden, setNativeSplashHidden] = useState(false);
	const [eyesBlinked, setEyesBlinked] = useState(motionReduced);

	const laidOutRef = useRef(false);

	const enterStyle = useAnimatedStyle(() => ({
		opacity: enterProgress.get(),
		transform: [{ scale: 1.035 - 0.035 * enterProgress.get() }],
	}));
	const exitStyle = useAnimatedStyle(() => ({ opacity: exitOpacity.get() }));

	/** 네이티브 스플래시가 사라지면 등장 애니메이션 실행 */
	useEffect(() => {
		if (!nativeSplashHidden || motionReduced) {
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
							scheduleOnRN(setEyesBlinked, true);
						}
					}),
				),
			),
		);

		return () => {
			cancelAnimation(enterProgress);
			cancelAnimation(eyeOpenness);
		};
	}, [enterProgress, eyeOpenness, motionReduced, nativeSplashHidden]);

	/** 다운로드 진행률만큼 막대 채우기 */
	useEffect(() => {
		if (downloadProgress === undefined) {
			return;
		}

		downloadFill.set(withTiming(downloadProgress, { duration: motionReduced ? 0 : 200 }));
	}, [downloadFill, downloadProgress, motionReduced]);

	/** 앱 시작 준비가 끝나면 스플래시 숨기기 */
	useEffect(() => {
		if (!bootstrapSettled || !nativeSplashHidden || !eyesBlinked || !onComplete) {
			return;
		}

		exitOpacity.set(
			withTiming(0, { duration: motionReduced ? 0 : 200 }, (finished) => {
				if (finished) {
					scheduleOnRN(onComplete);
				}
			}),
		);

		return () => cancelAnimation(exitOpacity);
	}, [eyesBlinked, onComplete, exitOpacity, bootstrapSettled, motionReduced, nativeSplashHidden]);

	/** 네이티브 스플래시 숨기기 */
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

				{/*얼굴 그림*/}
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

					{/*눈을 깜빡인 뒤에도 다운로드가 남아 있으면 진행률 표시*/}
					{downloadProgress !== undefined && eyesBlinked && (
						<AppSplashProgressBar progress={downloadFill} percent={Math.round(downloadProgress * 100)} />
					)}
				</Svg>
			</Animated.View>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: { ...StyleSheet.absoluteFill, backgroundColor: colors.brand },
});

export default AppSplash;
