import { StyleProp, StyleSheet, ViewStyle } from "react-native"

import { PressableSurface, SurfaceTone } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { colors, font, radius } from "@/theme"

export function Chip({
	label,
	selected,
	onPress,
	testID,
	style,
	tone = "primary",
	disabled = false,
}: {
	label: string
	selected?: boolean
	tone?: SurfaceTone
	disabled?: boolean
	onPress(): void
	testID?: string
	style?: StyleProp<ViewStyle>
}) {
	return (
		<PressableSurface
			testID={testID}
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{ selected: Boolean(selected) }}
			onPress={onPress}
			tone={selected ? tone : "neutral"}
			depth={2}
			disabled={disabled}
			hitSlop={6}
			cornerRadius={radius.pill}
			style={[styles.shell, style]}
			contentStyle={styles.chip}
		>
			<Copy
				numberOfLines={1}
				style={[styles.chipText, selected && { color: colors.onAccent }]}
			>
				{label}
			</Copy>
		</PressableSurface>
	)
}

const styles = StyleSheet.create({
	shell: { flexShrink: 0 },
	chip: {
		minHeight: 32,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 14,
		paddingVertical: 4,
	},
	chipText: { fontSize: 13.5, color: colors.muted, fontFamily: font.extraBold },
})
