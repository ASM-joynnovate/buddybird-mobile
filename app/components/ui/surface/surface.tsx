import type { PropsWithChildren } from "react"
import { type StyleProp, StyleSheet, View, type ViewProps, type ViewStyle } from "react-native"
import Animated from "react-native-reanimated"

import { colors, radius } from "@/theme"

const tones = {
	neutral: { face: colors.background, edge: colors.border },
	primary: { face: colors.orange, edge: colors.orangeDark },
	blue: { face: colors.blue, edge: colors.blueDark },
	purple: { face: colors.purple, edge: colors.purpleDark },
	selected: { face: colors.orangeSelected, edge: colors.orange },
	plain: { face: "transparent", edge: "transparent" },
	danger: { face: colors.error, edge: colors.error },
	muted: { face: colors.disabledBackground, edge: colors.disabledBackground },
} as const

export type SurfaceTone = keyof typeof tones

interface Props extends ViewProps {
	tone?: SurfaceTone
	depth?: number
	cornerRadius?: number
	contentStyle?: StyleProp<ViewStyle>
	color?: string
	backgroundColor?: string
}

export type SurfaceProps = PropsWithChildren<Props>

export function Surface({
	children,
	tone = "neutral",
	depth = 4,
	cornerRadius = radius.card,
	style,
	contentStyle,
	color,
	backgroundColor,
	...props
}: SurfaceProps) {
	const palette = { face: backgroundColor ?? tones[tone].face, edge: color ?? tones[tone].edge }

	return (
		<View
			{...props}
			collapsable={false}
			style={[styles.shell, { borderRadius: cornerRadius, paddingBottom: depth }, style]}
		>
			<View
				pointerEvents="none"
				style={[
					StyleSheet.absoluteFill,
					{ top: depth, backgroundColor: palette.edge, borderRadius: cornerRadius },
				]}
			/>
			<Animated.View
				style={[
					styles.face,
					{
						backgroundColor: palette.face,
						borderColor: palette.edge,
						borderRadius: cornerRadius,
					},
					contentStyle,
				]}
			>
				{children}
			</Animated.View>
		</View>
	)
}

const styles = StyleSheet.create({
	shell: { borderCurve: "continuous", minWidth: 0, maxWidth: "100%" },
	face: { minWidth: 0, borderWidth: 2, borderCurve: "continuous" },
})
