import { useEffect } from 'react';

import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import type { LucideIcon } from 'lucide-react-native';
import Animated, {
	cancelAnimation,
	Easing,
	interpolate,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withTiming,
} from 'react-native-reanimated';

import { SECOND } from '@/config/units';
import { colors, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';

const LAND_MS = 1.1 * SECOND;

const landEasing = Easing.bezier(0.16, 1, 0.3, 1);

interface Props {
	icon: LucideIcon;
	label: string;
	tilt: number;
	delay: number;
	animated: boolean;
	style?: StyleProp<ViewStyle>;
}

/**
 * 창문으로 날아와 벽에 붙는 소식 컴포넌트
 * @param icon 소식 아이콘
 * @param label 소식 이름
 * @param tilt 벽에 붙었을 때의 기울기
 * @param delay 날아오기 전에 기다리는 시간
 * @param animated 날아오는 움직임 실행 여부
 * @param style 소식 위치
 */
const MarketingSceneNote = ({ icon: Icon, label, tilt, delay, animated, style }: Props) => {
	const reducedMotion = useReducedMotion();

	const landProgress = useSharedValue(reducedMotion ? 1 : 0);

	const noteStyle = useAnimatedStyle(() => {
		const progress = landProgress.get();

		return {
			opacity: interpolate(progress, [0, 0.3, 1], [0, 1, 1]),
			transform: [
				{ translateX: interpolate(progress, [0, 1], [60, 0]) },
				{ translateY: interpolate(progress, [0, 1], [-90, 0]) },
				{ rotate: `${interpolate(progress, [0, 1], [18, tilt])}deg` },
				{ scale: interpolate(progress, [0, 1], [0.6, 1]) },
			],
		};
	});

	/** 움직임이 켜져 있으면 날아와서 벽에 붙음 */
	useEffect(() => {
		if (!animated) {
			return;
		}

		landProgress.set(0);
		landProgress.set(withDelay(delay, withTiming(1, { duration: LAND_MS, easing: landEasing })));

		return () => cancelAnimation(landProgress);
	}, [animated, delay, landProgress]);

	return (
		<Animated.View style={[styles.note, style, noteStyle]}>
			<View style={styles.pin} />

			<View style={styles.iconContainer}>
				<Icon size={20} color={colors.onFilled} />
			</View>
			<Copy style={styles.label}>{label}</Copy>

			<View style={styles.line} />
			<View style={[styles.line, styles.shortLine]} />
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	note: {
		position: 'absolute',
		width: 132,
		gap: 8,
		paddingTop: 18,
		paddingHorizontal: 12,
		paddingBottom: 12,
		borderWidth: 2,
		borderColor: colors.border,
		borderRadius: radius.tile,
		borderCurve: 'continuous',
		backgroundColor: colors.background,
	},
	pin: {
		position: 'absolute',
		top: -7,
		alignSelf: 'center',
		width: 14,
		height: 14,
		borderRadius: radius.pill,
		backgroundColor: colors.orange,
	},
	iconContainer: {
		width: 36,
		height: 36,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: radius.pill,
		backgroundColor: colors.orange,
	},
	label: { fontFamily: font.black, fontSize: 16, lineHeight: 22 },
	line: { height: 6, borderRadius: radius.pill, backgroundColor: colors.surface },
	shortLine: { width: '64%' },
});

export default MarketingSceneNote;
