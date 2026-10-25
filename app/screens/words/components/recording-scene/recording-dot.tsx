import { useEffect } from 'react';

import { StyleSheet } from 'react-native';

import Animated, {
	cancelAnimation,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';

import { colors, radius } from '@/theme';

const BLINK_MS = 600;

interface Props {
	size: number;
	animated: boolean;
}

/**
 * 깜빡이는 녹음 표시 컴포넌트
 * @param size 점의 지름
 * @param animated 깜빡임 실행 여부
 */
const RecordingSceneRecordingDot = ({ size, animated }: Props) => {
	const opacity = useSharedValue(1);

	const opacityStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

	/** 애니메이션이 켜져 있으면 녹음 표시가 깜빡임 */
	useEffect(() => {
		if (!animated) {
			return;
		}

		opacity.set(withRepeat(withTiming(0.3, { duration: BLINK_MS }), -1, true));

		return () => cancelAnimation(opacity);
	}, [animated, opacity]);

	return <Animated.View style={[styles.dot, { width: size, height: size }, opacityStyle]} />;
};

const styles = StyleSheet.create({
	dot: { borderRadius: radius.pill, backgroundColor: colors.error },
});

export default RecordingSceneRecordingDot;
