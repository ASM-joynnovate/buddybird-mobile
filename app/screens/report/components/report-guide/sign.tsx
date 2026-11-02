import { type ReactNode, useEffect } from 'react';

import { StyleSheet, useWindowDimensions, View } from 'react-native';

import Animated, {
	Easing,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import { SECOND } from '@/config/units';
import { signDropProgress } from '@/utils/buddy-sign';

import BuddySign from '@/components/buddy-sign';
import { SIGN_DROP_DISTANCE } from '@/components/buddy-sign/constants';
import MascotArtwork from '@/components/mascot/artwork';

const DROP_MS = SECOND;

interface Props {
	children: ReactNode;
	action: { label: string; onPress: () => void };
}

/**
 * 단계별 안내 팻말 컴포넌트
 * @param children 팻말 문구
 * @param action 팻말 오른쪽 버튼
 */
const ReportGuideSign = ({ children, action }: Props) => {
	const { height } = useWindowDimensions();

	const motionReduced = useReducedMotion();

	const dropElapsedMs = useSharedValue(motionReduced ? DROP_MS : 0);

	const signStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: -(1 - signDropProgress(dropElapsedMs.get() / SECOND)) * SIGN_DROP_DISTANCE }],
	}));

	/** 팻말 낙하 애니메이션 실행 */
	useEffect(() => {
		if (!motionReduced) {
			dropElapsedMs.set(withTiming(DROP_MS, { duration: DROP_MS, easing: Easing.linear }));
		}
	}, [dropElapsedMs, motionReduced]);

	return (
		<Animated.View style={signStyle}>
			<BuddySign cordLength={height} mascot=<MascotArtwork /> action={action}>
				<View style={styles.message}>{children}</View>
			</BuddySign>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	message: { flexShrink: 1 },
});

export default ReportGuideSign;
