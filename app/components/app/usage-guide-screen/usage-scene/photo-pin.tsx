import { useEffect } from 'react';

import { StyleSheet, View } from 'react-native';

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

const PIN_SIZE = 22;
const DOT_SIZE = 14;
const PULSE_MS = 1.6 * SECOND;
const PULSE_MAX_SCALE = 1.9;
const HALO_COLOR = '#ff960059';

interface Props {
	x: number;
	y: number;
	animated: boolean;
}

/**
 * 사진 속 기기 화면 핀 컴포넌트
 * @param x 핀 가운데의 가로 위치
 * @param y 핀 가운데의 세로 위치
 * @param animated 애니메이션 실행 여부
 */
const UsageScenePhotoPin = ({ x, y, animated }: Props) => {
	const pulseProgress = useSharedValue(0);

	const pulseStyle = useAnimatedStyle(() => ({
		opacity: interpolate(pulseProgress.get(), [0, 1], [0.9, 0]),
		transform: [{ scale: interpolate(pulseProgress.get(), [0, 1], [1, PULSE_MAX_SCALE]) }],
	}));

	/** 핀 둘레가 퍼지는 애니메이션 반복 */
	useEffect(() => {
		if (!animated) {
			return;
		}

		pulseProgress.set(withRepeat(withTiming(1, { duration: PULSE_MS, easing: Easing.out(Easing.quad) }), -1));

		return () => cancelAnimation(pulseProgress);
	}, [animated, pulseProgress]);

	return (
		<View style={[styles.pin, { left: x - PIN_SIZE / 2, top: y - PIN_SIZE / 2 }]}>
			{animated && <Animated.View style={[styles.halo, pulseStyle]} />}
			<View style={styles.halo} />
			<View style={styles.dot} />
		</View>
	);
};

const styles = StyleSheet.create({
	pin: {
		position: 'absolute',
		width: PIN_SIZE,
		height: PIN_SIZE,
		alignItems: 'center',
		justifyContent: 'center',
	},
	halo: { ...StyleSheet.absoluteFill, borderRadius: radius.pill, backgroundColor: HALO_COLOR },
	dot: {
		width: DOT_SIZE,
		height: DOT_SIZE,
		borderWidth: 2,
		borderColor: colors.onFilled,
		borderRadius: radius.pill,
		backgroundColor: colors.orange,
	},
});

export default UsageScenePhotoPin;
