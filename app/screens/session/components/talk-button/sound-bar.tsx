import { StyleSheet } from 'react-native';

import Animated, { type SharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { radius } from '@/theme';
import { sessionColors } from '@/theme/session-colors';

const BAR_MIN_HEIGHT = 5;
const BAR_MAX_HEIGHT = 18;
const LEVEL_MS = 100;

interface Props {
	audioLevel: SharedValue<number>;
	threshold: number;
}

/**
 * 소리 막대 컴포넌트
 * @param audioLevel 보내는 마이크 소리 크기
 * @param threshold 막대가 켜지는 소리 크기
 */
const TalkButtonSoundBar = ({ audioLevel, threshold }: Props) => {
	const heightStyle = useAnimatedStyle(() => ({
		height: withTiming(audioLevel.get() >= threshold ? BAR_MAX_HEIGHT : BAR_MIN_HEIGHT, { duration: LEVEL_MS }),
	}));

	return <Animated.View style={[styles.bar, heightStyle]} />;
};

const styles = StyleSheet.create({
	bar: { width: 3, borderRadius: radius.pill, backgroundColor: sessionColors.cameraOn },
});

export default TalkButtonSoundBar;
