import { useEffect } from 'react';

import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import Animated, {
	cancelAnimation,
	Easing,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';

import { SECOND } from '@/config/units';
import { colors, radius } from '@/theme';

const WINDOW_WIDTH = 88;
const WINDOW_HEIGHT = 100;
const CLOUD_DRIFT_MS = 9 * SECOND;
const CLOUD_STILL_PROGRESS = 0.4;

interface Props {
	scale: number;
	animated: boolean;
	style?: StyleProp<ViewStyle>;
}

/**
 * 구름이 지나가는 창문 컴포넌트
 * @param scale 그림 배율
 * @param animated 구름 움직임 실행 여부
 * @param style 창문 위치
 */
const SceneWindow = ({ scale, animated, style }: Props) => {
	const cloudProgress = useSharedValue(CLOUD_STILL_PROGRESS);

	const cloudStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: interpolate(cloudProgress.get(), [0, 1], [-50, 100]) * scale }],
	}));

	/** 움직임이 켜져 있으면 구름이 창문을 가로질러 지나감 */
	useEffect(() => {
		if (!animated) {
			return;
		}

		cloudProgress.set(0);
		cloudProgress.set(withRepeat(withTiming(1, { duration: CLOUD_DRIFT_MS, easing: Easing.linear }), -1));

		return () => cancelAnimation(cloudProgress);
	}, [animated, cloudProgress]);

	return (
		<View
			style={[
				styles.window,
				{ width: WINDOW_WIDTH * scale, height: WINDOW_HEIGHT * scale, borderRadius: 16 * scale },
				style,
			]}
		>
			<Animated.View
				style={[styles.cloud, { top: 22 * scale, width: 34 * scale, height: 12 * scale }, cloudStyle]}
			>
				<View
					style={[
						styles.cloudTop,
						{ left: 7 * scale, top: -7 * scale, width: 16 * scale, height: 16 * scale },
					]}
				/>
			</Animated.View>

			<View style={[styles.verticalBar, { width: 4 * scale, marginLeft: -2 * scale }]} />
			<View style={[styles.horizontalBar, { height: 4 * scale, marginTop: -2 * scale }]} />
		</View>
	);
};

const styles = StyleSheet.create({
	window: {
		position: 'absolute',
		overflow: 'hidden',
		borderWidth: 4,
		borderColor: colors.background,
		borderCurve: 'continuous',
		backgroundColor: colors.bluePale,
	},
	cloud: { position: 'absolute', left: 0, borderRadius: radius.pill, backgroundColor: colors.background },
	cloudTop: { position: 'absolute', borderRadius: radius.pill, backgroundColor: colors.background },
	verticalBar: { position: 'absolute', top: 0, bottom: 0, left: '50%', backgroundColor: colors.background },
	horizontalBar: { position: 'absolute', left: 0, right: 0, top: '50%', backgroundColor: colors.background },
});

export default SceneWindow;
