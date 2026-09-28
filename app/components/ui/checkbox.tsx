import { useEffect } from 'react';

import { StyleSheet, View } from 'react-native';

import Animated, {
	Easing,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import { colors, depths } from '@/theme';

import { CheckMark } from '@/components/ui/check-mark';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const CHECK_DEPTH = 'medium';

interface Props {
	checked: boolean;
	disabled?: boolean;
	onPress(): void;
}

export function Checkbox({ checked, disabled, onPress }: Props) {
	const reducedMotion = useReducedMotion();

	const markScale = useSharedValue(1);
	const markStyle = useAnimatedStyle(() => ({ transform: [{ scale: markScale.get() }] }));

	useEffect(() => {
		if (checked && !reducedMotion) {
			markScale.set(0.7);
			markScale.set(withTiming(1, { duration: 160, easing: Easing.out(Easing.cubic) }));
		}
	}, [checked, reducedMotion, markScale]);

	let surfaceVariant: 'primary' | 'neutral' | 'disabled' = checked ? 'primary' : 'neutral';

	if (disabled) {
		surfaceVariant = 'disabled';
	}

	return (
		<View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
			<PressableSurface
				onPress={onPress}
				disabled={disabled}
				variant={surfaceVariant}
				depth={disabled ? 'none' : CHECK_DEPTH}
				cornerRadius="small"
				style={[styles.box, disabled && { marginTop: depths[CHECK_DEPTH] }]}
				contentStyle={styles.boxFace}
			>
				<Animated.View style={markStyle}>
					<CheckMark size="small" color={checked && !disabled ? colors.onFilled : colors.subtle} />
				</Animated.View>
			</PressableSurface>
		</View>
	);
}

const styles = StyleSheet.create({
	box: { width: 26 },
	boxFace: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
});
