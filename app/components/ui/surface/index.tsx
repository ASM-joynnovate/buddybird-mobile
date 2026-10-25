import type { ReactNode } from 'react';

import { type StyleProp, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import Animated, { type AnimatedStyle } from 'react-native-reanimated';

import { colors, depths, radius } from '@/theme';

const variants = {
	neutral: { face: colors.background, edge: colors.border, border: colors.border },
	primary: { face: colors.orange, edge: colors.orangeDark, border: colors.orange },
	selected: { face: colors.orangePale, edge: colors.orange, border: colors.orange },
	danger: { face: colors.error, edge: colors.errorDark, border: colors.error },
	onDark: { face: colors.background, edge: colors.textDark, border: colors.background },
	plain: { face: 'transparent', edge: 'transparent', border: 'transparent' },
	disabled: { face: colors.disabledBackground, edge: colors.disabledBackground, border: colors.disabledBackground },
} as const;

type SurfaceVariant = keyof typeof variants;

interface Props extends ViewProps {
	variant?: SurfaceVariant;
	depth?: keyof typeof depths;
	cornerRadius?: keyof typeof radius;
	contentStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
	edgeColor?: string;
	faceColor?: string;
	children: ReactNode;
}

export type SurfaceProps = Props;

export const Surface = ({
	children,
	variant = 'neutral',
	depth = 'medium',
	cornerRadius = 'card',
	style,
	contentStyle,
	edgeColor,
	faceColor,
	...props
}: Props) => {
	const palette = {
		face: faceColor ?? variants[variant].face,
		edge: edgeColor ?? variants[variant].edge,
		border: edgeColor ?? variants[variant].border,
	};
	const borderRadius = radius[cornerRadius];
	const edgeHeight = depths[depth];

	return (
		<View
			{...props}
			collapsable={false}
			style={[styles.container, { borderRadius, paddingBottom: edgeHeight }, style]}
		>
			<View
				pointerEvents="none"
				style={[StyleSheet.absoluteFill, { top: edgeHeight, backgroundColor: palette.edge, borderRadius }]}
			/>

			<Animated.View
				style={[
					styles.face,
					{
						backgroundColor: palette.face,
						borderColor: palette.border,
						borderRadius,
					},
					contentStyle,
				]}
			>
				{children}
			</Animated.View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { borderCurve: 'continuous', minWidth: 0, maxWidth: '100%' },
	face: { minWidth: 0, borderWidth: 2, borderCurve: 'continuous' },
});
