import { StyleSheet } from "react-native"

import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { colors, font, radius } from "@/theme"

interface Props {
	label: string
	selected?: boolean
	onPress(): void
}

export function Chip({ label, selected, onPress }: Props) {
	return (
		<PressableSurface
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{ selected: Boolean(selected) }}
			onPress={onPress}
			tone={selected ? "primary" : "neutral"}
			depth={2}
			hitSlop={6}
			cornerRadius={radius.pill}
			style={styles.shell}
			contentStyle={styles.chip}
		>
			<Copy numberOfLines={1} style={[styles.chipText, selected && styles.selectedText]}>
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
	selectedText: { color: colors.onAccent },
})
