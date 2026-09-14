import { StyleProp, StyleSheet, ViewStyle } from "react-native"

import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { colors, font, radius } from "@/theme"

export function Chip({
	label,
	selected,
	onPress,
	testID,
	style,
}: {
	label: string
	selected?: boolean
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
			tone={selected ? "primary" : "neutral"}
			cornerRadius={radius.pill}
			style={style}
			contentStyle={styles.chip}
		>
			<Copy style={[styles.chipText, selected && { color: colors.onAccent }]}>{label}</Copy>
		</PressableSurface>
	)
}

const styles = StyleSheet.create({
	chip: {
		minHeight: 44,
		justifyContent: "center",
		paddingHorizontal: 15,
		paddingVertical: 7,
	},
	chipText: { fontSize: 16, color: colors.muted, fontFamily: font.extraBold },
})
