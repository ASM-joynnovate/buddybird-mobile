import { StyleSheet, View } from 'react-native';

import Animated, { Easing, Keyframe, useReducedMotion } from 'react-native-reanimated';

import { colors } from '@/theme';
import { SECOND } from '@/utils/units';

const FALL_MS = 1.8 * SECOND;

const fallEasing = Easing.bezier(0.3, 0.6, 0.4, 1);

const palettes = {
	yellow: { face: colors.yellow, edge: colors.yellowDark },
	purple: { face: colors.purple, edge: colors.purpleDark },
};

const PIECES = [
	{ left: '7%', delay: 0, sway: -16, tone: 'yellow' },
	{ left: '68%', delay: 370, sway: 7, tone: 'purple' },
	{ left: '29%', delay: 240, sway: -2, tone: 'yellow' },
	{ left: '90%', delay: 110, sway: -11, tone: 'purple' },
	{ left: '51%', delay: 480, sway: 12, tone: 'yellow' },
	{ left: '12%', delay: 350, sway: 3, tone: 'purple' },
	{ left: '73%', delay: 220, sway: -6, tone: 'yellow' },
	{ left: '34%', delay: 90, sway: -15, tone: 'purple' },
	{ left: '95%', delay: 460, sway: 8, tone: 'yellow' },
	{ left: '56%', delay: 330, sway: -1, tone: 'purple' },
	{ left: '17%', delay: 200, sway: -10, tone: 'yellow' },
	{ left: '78%', delay: 70, sway: 13, tone: 'purple' },
	{ left: '39%', delay: 440, sway: 4, tone: 'yellow' },
	{ left: '0%', delay: 310, sway: -5, tone: 'purple' },
	{ left: '61%', delay: 180, sway: -14, tone: 'yellow' },
	{ left: '22%', delay: 50, sway: 9, tone: 'purple' },
] as const;

/** 학습 완료를 축하하는 조각이 한 번 떨어지는 컴포넌트 */
const Confetti = () => {
	const reducedMotion = useReducedMotion();

	if (reducedMotion) {
		return null;
	}

	return (
		<View pointerEvents="none" style={StyleSheet.absoluteFill}>
			{PIECES.map((piece) => (
				<Animated.View
					key={piece.left}
					entering={new Keyframe({
						0: { opacity: 1, transform: [{ translateY: 0 }, { translateX: 0 }, { rotate: '0deg' }] },
						25: {
							transform: [{ translateY: 220 }, { translateX: piece.sway }, { rotate: '90deg' }],
							easing: fallEasing,
						},
						50: {
							transform: [{ translateY: 440 }, { translateX: -piece.sway }, { rotate: '200deg' }],
							easing: fallEasing,
						},
						85: { opacity: 1, easing: fallEasing },
						100: {
							opacity: 0,
							transform: [{ translateY: 880 }, { translateX: piece.sway }, { rotate: '320deg' }],
							easing: fallEasing,
						},
					})
						.duration(FALL_MS)
						.delay(piece.delay)}
					style={[
						styles.piece,
						{
							left: piece.left,
							backgroundColor: palettes[piece.tone].face,
							borderBottomColor: palettes[piece.tone].edge,
						},
					]}
				/>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	piece: { position: 'absolute', top: -24, width: 8, height: 12, borderRadius: 2, borderBottomWidth: 4, opacity: 0 },
});

export default Confetti;
