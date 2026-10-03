import { useEffect, useState } from 'react';

import { type LayoutChangeEvent, StyleSheet } from 'react-native';

import Animated, {
	cancelAnimation,
	Easing,
	Extrapolation,
	interpolate,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';

import { SECOND } from '@/config/units';
import { colors, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';

const RISE_MS = 6 * SECOND;

const riseEasing = Easing.bezier(0.22, 0.8, 0.3, 1);

export interface FloatingWordStill {
	x: number;
	rise: number;
}

export interface FloatingWordPath {
	start: number;
	end: number;
	tilt: number;
	still: FloatingWordStill | null;
}

interface Props {
	word: string;
	path: FloatingWordPath;
	delay: number;
	riseHeight: number;
	areaWidth: number;
}

/**
 * 시트 뒤에서 떠올라 흘러가는 단어 컴포넌트
 * @param word 표시할 단어
 * @param path 가로 위치 비율과 기울기
 * @param delay 처음 떠오르기까지 기다리는 시간
 * @param riseHeight 떠오르는 높이
 * @param areaWidth 단어가 움직이는 영역의 폭
 */
const FloatingWordsItem = ({ word, path, delay, riseHeight, areaWidth }: Props) => {
	const reducedMotion = useReducedMotion();

	const progress = useSharedValue(0);

	const [wordWidth, setWordWidth] = useState(0);

	const measured = wordWidth > 0;
	const range = Math.max(areaWidth - wordWidth, 0);
	const stillStyle = path.still && {
		opacity: measured ? 1 : 0,
		transform: [
			{ translateX: path.still.x * range },
			{ translateY: -path.still.rise * riseHeight },
			{ rotate: `${path.tilt}deg` },
		],
	};

	const riseStyle = useAnimatedStyle(() => {
		const value = progress.get();

		return {
			opacity: measured ? interpolate(value, [0, 0.02, 0.7, 1], [0, 1, 1, 0], Extrapolation.CLAMP) : 0,
			transform: [
				{
					translateX:
						interpolate(
							value,
							[0, 0.18, 1],
							[path.start, path.start + (path.end - path.start) * 0.3, path.end],
						) * range,
				},
				{ translateY: interpolate(value, [0, 0.18, 1], [0, -0.35, -1]) * riseHeight },
				{ rotate: `${interpolate(value, [0, 0.18, 1], [0, path.tilt, -path.tilt])}deg` },
				{ scale: interpolate(value, [0, 0.18, 1], [0.9, 1, 0.96]) },
			],
		};
	});

	/** 움직임 줄이기 설정이 꺼져 있으면 떠오르는 애니메이션 반복 */
	useEffect(() => {
		if (reducedMotion) {
			return;
		}

		progress.set(withDelay(delay, withRepeat(withTiming(1, { duration: RISE_MS, easing: riseEasing }), -1, false)));

		return () => cancelAnimation(progress);
	}, [delay, progress, reducedMotion]);

	const handleLayout = (event: LayoutChangeEvent) => {
		setWordWidth(event.nativeEvent.layout.width);
	};

	return (
		<Animated.View
			renderToHardwareTextureAndroid
			shouldRasterizeIOS
			onLayout={handleLayout}
			style={[styles.bubble, reducedMotion && stillStyle ? stillStyle : riseStyle]}
		>
			<Copy style={styles.word}>{word}</Copy>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	bubble: {
		position: 'absolute',
		top: 0,
		left: 0,
		height: 40,
		paddingHorizontal: 16,
		justifyContent: 'center',
		borderRadius: radius.control,
		borderBottomLeftRadius: radius.xsmall,
		borderCurve: 'continuous',
		backgroundColor: colors.background,
	},
	word: { fontFamily: font.black, fontSize: 18, lineHeight: 24 },
});

export default FloatingWordsItem;
