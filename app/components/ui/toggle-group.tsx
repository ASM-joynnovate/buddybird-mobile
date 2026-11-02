import { type ReactNode, useEffect, useState } from 'react';

import { type LayoutRectangle, StyleSheet, View } from 'react-native';

import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { burstEasing, colors, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const THUMB_MOVE_MS = 200;

interface ToggleGroupOption<T extends string> {
	value: T;
	label: string;
	leading?: ReactNode;
}

interface Props<T extends string> {
	options: readonly ToggleGroupOption<T>[];
	value: T;
	onChange: (value: T) => void;
}

export const ToggleGroup = <T extends string>({ options, value, onChange }: Props<T>) => {
	const [optionLayouts, setOptionLayouts] = useState<Partial<Record<T, LayoutRectangle>>>({});

	const thumbX = useSharedValue(0);
	const thumbWidth = useSharedValue(0);

	const thumbStyle = useAnimatedStyle(() => ({
		width: thumbWidth.get(),
		transform: [{ translateX: thumbX.get() }],
	}));

	const selectedLayout = optionLayouts[value];

	useEffect(() => {
		if (!selectedLayout) {
			return;
		}

		if (thumbWidth.get() === 0) {
			thumbX.set(selectedLayout.x);
			thumbWidth.set(selectedLayout.width);
			return;
		}

		thumbX.set(withTiming(selectedLayout.x, { duration: THUMB_MOVE_MS, easing: burstEasing }));
		thumbWidth.set(withTiming(selectedLayout.width, { duration: THUMB_MOVE_MS, easing: burstEasing }));
	}, [selectedLayout, thumbWidth, thumbX]);

	return (
		<View style={styles.track}>
			<Animated.View style={[styles.thumb, thumbStyle]} />

			{options.map((option) => {
				const selected = option.value === value;

				return (
					<PressableSurface
						key={option.value}
						accessibilityRole="button"
						accessibilityLabel={option.label}
						accessibilityState={{ selected }}
						onPress={() => onChange(option.value)}
						onLayout={(event) =>
							setOptionLayouts((prev) => ({ ...prev, [option.value]: event.nativeEvent.layout }))
						}
						variant="plain"
						depth="none"
						cornerRadius="pill"
						contentStyle={styles.option}
					>
						{option.leading}
						<Copy style={[styles.label, selected && styles.selectedLabel]}>{option.label}</Copy>
					</PressableSurface>
				);
			})}
		</View>
	);
};

const styles = StyleSheet.create({
	track: {
		flexDirection: 'row',
		alignSelf: 'flex-start',
		padding: 3,
		borderRadius: radius.pill,
		backgroundColor: colors.surface,
	},
	thumb: {
		position: 'absolute',
		top: 3,
		bottom: 3,
		left: 0,
		borderRadius: radius.pill,
		borderBottomWidth: 2,
		borderBottomColor: colors.orangeDark,
		backgroundColor: colors.orange,
	},
	option: {
		minHeight: 32,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 12,
		borderWidth: 0,
	},
	label: { fontFamily: font.extraBold, fontSize: 13, color: colors.muted },
	selectedLabel: { color: colors.onFilled },
});
