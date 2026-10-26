import { useEffect } from 'react';

import { StyleSheet } from 'react-native';

import { CheckIcon, XIcon } from 'lucide-react-native';
import Animated, {
	Easing,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import { colors } from '@/theme';

import { Surface } from '@/components/ui/surface';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const KNOB_TRAVEL = 26;

interface Props {
	value: boolean;
	label: string;
	disabled?: boolean;
	onChange: (value: boolean) => void;
}

export const Toggle = ({ value, label, disabled = false, onChange }: Props) => {
	const motionReduced = useReducedMotion();

	const knobOffset = useSharedValue(value ? KNOB_TRAVEL : 0);

	const knobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: knobOffset.get() }] }));

	useEffect(() => {
		const offset = value ? KNOB_TRAVEL : 0;

		knobOffset.set(
			motionReduced ? offset : withTiming(offset, { duration: 180, easing: Easing.out(Easing.cubic) }),
		);
	}, [value, motionReduced, knobOffset]);

	return (
		<PressableSurface
			accessibilityRole="switch"
			accessibilityLabel={label}
			accessibilityState={{ checked: value }}
			onPress={() => onChange(!value)}
			disabled={disabled}
			variant={value ? 'primary' : 'disabled'}
			edgeColor={value ? undefined : colors.border}
			depth="medium"
			cornerRadius="toggle"
			style={disabled && styles.disabled}
			contentStyle={styles.track}
		>
			<Animated.View style={[styles.knobContainer, knobStyle]}>
				<Surface variant="neutral" depth="low" cornerRadius="small" contentStyle={styles.knob}>
					{value ? (
						<CheckIcon size={14} strokeWidth={3.5} color={colors.orange} />
					) : (
						<XIcon size={14} strokeWidth={3.5} color={colors.subtle} />
					)}
				</Surface>
			</Animated.View>
		</PressableSurface>
	);
};

const styles = StyleSheet.create({
	track: { width: 56, height: 30, justifyContent: 'center', paddingHorizontal: 2 },
	knobContainer: { alignSelf: 'flex-start' },
	knob: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 0 },
	disabled: { opacity: 0.5 },
});
