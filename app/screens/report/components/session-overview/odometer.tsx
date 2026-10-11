import { useEffect } from 'react';

import { StyleSheet, View } from 'react-native';

import Animated, {
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withTiming,
} from 'react-native-reanimated';

import { burstEasing } from '@/screens/report/components/session-detail-animations';
import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';

const DIGIT_HEIGHT = 34;
const ROLL_MS = 1000;
const ROLL_STAGGER_MS = 70;
const DIGITS = Array.from({ length: 10 }, (_, digit) => digit);

interface DigitProps {
	digit: number;
	order: number;
}

/**
 * 굴러서 멈추는 숫자 한 자리 컴포넌트
 * @param digit 멈출 숫자
 * @param order 숫자판 안에서의 순서
 */
const OdometerDigit = ({ digit, order }: DigitProps) => {
	const reducedMotion = useReducedMotion();

	const offset = useSharedValue(0);

	const stripStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.get() }] }));

	/** 숫자까지 굴러서 멈춤 */
	useEffect(() => {
		const target = -digit * DIGIT_HEIGHT;

		offset.set(
			reducedMotion
				? target
				: withDelay(order * ROLL_STAGGER_MS, withTiming(target, { duration: ROLL_MS, easing: burstEasing })),
		);
	}, [digit, offset, order, reducedMotion]);

	return (
		<View style={styles.digit}>
			<View style={styles.ring} />

			<View style={styles.window}>
				<View style={styles.inset} />

				<Animated.View style={stripStyle}>
					{DIGITS.map((stripDigit) => (
						<Copy key={stripDigit} style={styles.number}>
							{stripDigit}
						</Copy>
					))}
				</Animated.View>
			</View>
		</View>
	);
};

interface Props {
	value: string;
}

/**
 * 카운터처럼 굴러서 멈추는 숫자판 컴포넌트
 * @param value 숫자판에 보일 글자
 */
const SessionOverviewOdometer = ({ value }: Props) => {
	const characters = value.split('');

	return (
		<View style={styles.digits} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
			{characters.map((character, index) =>
				character === ':' ? (
					<View key={index} style={styles.separator}>
						<Copy style={styles.number}>:</Copy>
					</View>
				) : (
					<OdometerDigit
						key={index}
						digit={Number(character)}
						order={characters.slice(0, index).filter((previous) => previous !== ':').length}
					/>
				),
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	digits: { flexDirection: 'row', gap: 7 },
	digit: { width: 24, height: DIGIT_HEIGHT },
	ring: {
		position: 'absolute',
		top: -2,
		right: -2,
		bottom: -2,
		left: -2,
		borderRadius: 8,
		borderWidth: 2,
		borderColor: colors.border,
	},
	window: { flex: 1, overflow: 'hidden', borderRadius: 6, backgroundColor: colors.background },
	inset: { position: 'absolute', right: 0, bottom: 0, left: 0, height: 2, backgroundColor: colors.border },
	number: {
		height: DIGIT_HEIGHT,
		fontFamily: font.black,
		fontSize: 20,
		lineHeight: DIGIT_HEIGHT,
		textAlign: 'center',
		fontVariant: ['tabular-nums'],
	},
	separator: { width: 8, alignItems: 'center' },
});

export default SessionOverviewOdometer;
