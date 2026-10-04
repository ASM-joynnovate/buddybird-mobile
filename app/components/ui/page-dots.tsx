import { View } from 'react-native';

import Animated, { css, useReducedMotion } from 'react-native-reanimated';

import { colors } from '@/theme';

interface Props {
	count: number;
	currentIndex: number;
	label: string;
}

export const PageDots = ({ count, currentIndex, label }: Props) => {
	const reducedMotion = useReducedMotion();

	if (count < 2) {
		return null;
	}

	return (
		<View style={styles.container} accessible accessibilityLabel={label}>
			{Array.from({ length: count }, (_, dotIndex) => (
				<Animated.View
					key={dotIndex}
					style={[
						styles.dot,
						!reducedMotion && styles.dotTransition,
						dotIndex === currentIndex && styles.dotCurrent,
					]}
				/>
			))}
		</View>
	);
};

const styles = css.create({
	container: { flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center' },
	dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
	dotTransition: { transitionProperty: ['width', 'backgroundColor'], transitionDuration: 250 },
	dotCurrent: { width: 20, backgroundColor: colors.orange },
});
