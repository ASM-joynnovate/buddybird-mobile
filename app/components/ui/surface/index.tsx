import type { ReactNode } from 'react';

import { type StyleProp, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import Animated from 'react-native-reanimated';

import { colors, depths, radius } from '@/theme';

const variants = {
	neutral: { face: colors.background, edge: colors.border },
	primary: { face: colors.orange, edge: colors.orangeDark },
	selected: { face: colors.orangePale, edge: colors.orange },
	plain: { face: 'transparent', edge: 'transparent' },
	disabled: { face: colors.disabledBackground, edge: colors.disabledBackground },
} as const;

type SurfaceVariant = keyof typeof variants;

interface Props extends ViewProps {
	variant?: SurfaceVariant;
	depth?: keyof typeof depths;
	cornerRadius?: keyof typeof radius;
	contentStyle?: StyleProp<ViewStyle>;
	edgeColor?: string;
	faceColor?: string;
	children: ReactNode;
}

export type SurfaceProps = Props;

export const Surface = ({
	children,
	variant = 'neutral',
	depth = 'high',
	cornerRadius = 'card',
	style,
	contentStyle,
	edgeColor,
	faceColor,
	...props
}: Props) => {
	const palette = { face: faceColor ?? variants[variant].face, edge: edgeColor ?? variants[variant].edge };
	const borderRadius = radius[cornerRadius];
	const edgeHeight = depths[depth];

	return (
		<View
			{...props}
			collapsable={false}
			style={[styles.container, { borderRadius, paddingBottom: edgeHeight }, style]}
		>
			{/*아래로 드러나는 두께*/}
			<View
				pointerEvents="none"
				style={[StyleSheet.absoluteFill, { top: edgeHeight, backgroundColor: palette.edge, borderRadius }]}
			/>

			{/*윗면과 내용*/}
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
};

const styles = StyleSheet.create({
	container: { borderCurve: 'continuous', minWidth: 0, maxWidth: '100%' },
	face: { minWidth: 0, borderWidth: 2, borderCurve: 'continuous' },
});
