import { StyleSheet } from "react-native"

import { Icon, type IconName } from "@/components/ui/icon"
import { PressableSurface, type SurfaceTone } from "@/components/ui/surface"
import { colors, radius } from "@/theme"

export function IconButton({
	icon,
	label,
	onPress,
	color = colors.text,
	size = 48,
	testID,
	disabled,
	tone = "plain",
	round = false,
	iconSize = 24,
	depth,
}: {
	icon: IconName
	label: string
	onPress(): void
	color?: string
	size?: number
	testID?: string
	disabled?: boolean
	tone?: SurfaceTone
	round?: boolean
	iconSize?: number
	depth?: number
}) {
	return (
		<PressableSurface
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{ disabled: Boolean(disabled) }}
			disabled={disabled}
			onPress={onPress}
			testID={testID}
			tone={tone}
			depth={depth ?? (tone === "plain" ? 0 : 4)}
			cornerRadius={round ? radius.pill : radius.control}
			style={{ minWidth: size, flexShrink: 0 }}
			contentStyle={[styles.iconButton, { minWidth: size, minHeight: size }]}
		>
			<Icon name={icon} color={disabled ? colors.disabled : color} size={iconSize} />
		</PressableSurface>
	)
}

const styles = StyleSheet.create({
	iconButton: {
		flexGrow: 0,
		alignItems: "center",
		justifyContent: "center",
	},
})
