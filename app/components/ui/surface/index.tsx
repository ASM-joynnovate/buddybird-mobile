import type { PropsWithChildren } from 'react';

import { type StyleProp, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import Animated from 'react-native-reanimated';

import { colors, depths, radius } from '@/theme';

const variants = {
	neutral: { face: colors.background, edge: colors.border },
	primary: { face: colors.orange, edge: colors.orangeDark },
	selected: { face: colors.orangeSelected, edge: colors.orange },
	plain: { face: 'transparent', edge: 'transparent' },
	muted: { face: colors.disabledBackground, edge: colors.disabledBackground },
} as const;

type SurfaceVariant = keyof typeof variants;

interface Props extends ViewProps {
	variant?: SurfaceVariant;
	depth?: keyof typeof depths;
	cornerRadius?: keyof typeof radius;
	contentStyle?: StyleProp<ViewStyle>;
	color?: string;
	backgroundColor?: string;
}

export type SurfaceProps = PropsWithChildren<Props>;

export function Surface({
	children,
	variant = 'neutral',
	depth = 'high',
	cornerRadius = 'card',
	style,
	contentStyle,
	color,
	backgroundColor,
	...props
}: SurfaceProps) {
	const palette = { face: backgroundColor ?? variants[variant].face, edge: color ?? variants[variant].edge };
	const borderRadius = radius[cornerRadius];
	const edgeHeight = depths[depth];

	return (
		<View {...props} collapsable={false} style={[styles.shell, { borderRadius, paddingBottom: edgeHeight }, style]}>
			<View
				pointerEvents="none"
				style={[StyleSheet.absoluteFill, { top: edgeHeight, backgroundColor: palette.edge, borderRadius }]}
			/>
			<Animated.View
				style={[
					styles.face,
					{
						backgroundColor: palette.face,
						borderColor: palette.edge,
						borderRadius,
					},
					contentStyle,
				]}
			>
				{children}
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	shell: { borderCurve: 'continuous', minWidth: 0, maxWidth: '100%' },
	face: { minWidth: 0, borderWidth: 2, borderCurve: 'continuous' },
});
