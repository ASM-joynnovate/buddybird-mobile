import { StyleSheet } from "react-native"

import { PressableSurface, SurfaceTone } from "@/components/ui/surface"
import { Icon, IconName } from "@/components/ui/icon"
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
			depth={tone === "plain" ? 0 : 4}
			cornerRadius={round ? radius.pill : radius.control}
			style={{ width: size }}
			contentStyle={[styles.iconButton, { width: size, height: size }]}
		>
			<Icon name={icon} color={color} />
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
