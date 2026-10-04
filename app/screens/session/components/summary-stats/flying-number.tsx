import { useEffect } from 'react';

import { StyleSheet } from 'react-native';

import Animated, {
	Easing,
	type MeasuredDimensions,
	measure,
	useAnimatedRef,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withSequence,
	withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

import CountUpText, { type CountUnit } from '@/screens/session/components/count-up-text';
import { type SummaryMetric, summaryMetricColors } from '@/screens/session/components/summary-colors';
import { colors, font } from '@/theme';

const FLIGHT_MS = 750;
const LIFT_MS = 262;
const DROP_MS = 488;
const LIFT_HEIGHT = 56;
const FADE_DELAY_MS = 690;
const FADE_MS = 60;

const flightEasing = Easing.bezier(0.45, 0, 0.25, 1);
const liftEasing = Easing.bezier(0.2, 0.8, 0.4, 1);
const dropEasing = Easing.bezier(0.6, 0, 0.9, 0.5);

interface Props {
	value: number;
	unit: CountUnit;
	metric: SummaryMetric;
	origin: MeasuredDimensions;
	onLanded: () => void;
}

/**
 * 말풍선 숫자 자리에서 칩 값 자리로 날아와 내려앉는 숫자 컴포넌트
 * @param value 보여 줄 값
 * @param unit 횟수 또는 밀리초 시간
 * @param metric 색을 고를 완료 화면 항목
 * @param origin 말풍선 숫자의 화면 위치
 * @param onLanded 내려앉으면 실행할 함수
 */
const SummaryStatsFlyingNumber = ({ value, unit, metric, origin, onLanded }: Props) => {
	const tokenRef = useAnimatedRef<Animated.View>();
	const fullProgress = useSharedValue(1);
	const offsetX = useSharedValue(0);
	const offsetY = useSharedValue(0);
	const scale = useSharedValue(1);
	const opacity = useSharedValue(0);

	const palette = summaryMetricColors[metric];
	const flightStyle = useAnimatedStyle(() => ({
		opacity: opacity.get(),
		transform: [{ translateX: offsetX.get() }, { translateY: offsetY.get() }, { scale: scale.get() }],
	}));

	/** 그려진 뒤 말풍선 숫자 자리에서 출발해 칩 값 자리로 날아오기 */
	useEffect(() => {
		scheduleOnUI(() => {
			'worklet';

			const target = measure(tokenRef);

			if (!target) {
				scheduleOnRN(onLanded);

				return;
			}

			const startY = origin.pageY - target.pageY;

			offsetX.set(origin.pageX - target.pageX);
			offsetY.set(startY);
			scale.set(origin.height / target.height);
			opacity.set(1);

			offsetX.set(withTiming(0, { duration: FLIGHT_MS, easing: flightEasing }));
			offsetY.set(
				withSequence(
					withTiming(startY - LIFT_HEIGHT, { duration: LIFT_MS, easing: liftEasing }),
					withTiming(0, { duration: DROP_MS, easing: dropEasing }),
				),
			);
			scale.set(withTiming(1, { duration: FLIGHT_MS, easing: flightEasing }));
			opacity.set(
				withDelay(
					FADE_DELAY_MS,
					withTiming(0, { duration: FADE_MS }, (finished) => {
						if (finished) {
							scheduleOnRN(onLanded);
						}
					}),
				),
			);
		});
	}, [offsetX, offsetY, onLanded, opacity, origin, scale, tokenRef]);

	return (
		<Animated.View
			ref={tokenRef}
			pointerEvents="none"
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
			style={[styles.token, { backgroundColor: palette.face, borderBottomColor: palette.edge }, flightStyle]}
		>
			<CountUpText progress={fullProgress} from={value} to={value} unit={unit} style={styles.text} />
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	token: {
		position: 'absolute',
		top: 0,
		left: -8,
		paddingHorizontal: 8,
		paddingBottom: 4,
		borderRadius: 8,
		borderBottomWidth: 4,
		transformOrigin: 'left top',
	},
	text: {
		fontFamily: font.black,
		fontSize: 20,
		lineHeight: 24,
		color: colors.onFilled,
		fontVariant: ['tabular-nums'],
	},
});

export default SummaryStatsFlyingNumber;
